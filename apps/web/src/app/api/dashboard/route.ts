import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface AttendingEvent {
  id: string
  eventId: string
  eventName: string
  timestamp: Date
  // Event details (if available)
  category?: string
  day?: string
  time?: string
  location?: string
  imageUrl?: string | null
  eventDate?: string | null
}

interface HostingEvent {
  id: string
  name: string
  day: string
  date: string | null
  time: string
  location: string
  imageUrl: string | null
  category: string
  recurring: boolean
  goingCount: number
  organizer: string
}

interface DashboardResponse {
  attending: {
    events: AttendingEvent[]
    count: number
  }
  hosting: {
    events: HostingEvent[]
    pastEvents: HostingEvent[]
    stats: {
      activeEvents: number
      totalSignups: number
      totalEarnings: number
      paidAttendees: number
    }
  }
  isHost: boolean
}

export async function GET() {
  try {
    // Check Clerk authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Fetch attending events and hosting events in parallel
    const [attendanceRecords, hostedSubmissions] = await Promise.all([
      // Events user is ATTENDING
      prisma.eventAttendance.findMany({
        where: {
          email: normalizedEmail,
          confirmed: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
          id: true,
          eventId: true,
          eventName: true,
          timestamp: true,
        },
      }),
      // Events user is HOSTING (matched by contactEmail)
      prisma.eventSubmission.findMany({
        where: {
          contactEmail: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
          status: 'APPROVED',
        },
        orderBy: { eventDate: 'asc' },
        select: {
          id: true,
          eventName: true,
          category: true,
          day: true,
          eventDate: true,
          time: true,
          location: true,
          imageUrl: true,
          recurring: true,
          organizerInstagram: true,
        },
      }),
    ])

    // Enrich attending events with event details
    const attendingEventIds = attendanceRecords.map((a) => a.eventId)
    const eventDetails = await prisma.eventSubmission.findMany({
      where: {
        id: { in: attendingEventIds },
        status: 'APPROVED',
      },
      select: {
        id: true,
        category: true,
        day: true,
        time: true,
        location: true,
        imageUrl: true,
        eventDate: true,
      },
    })

    const eventDetailsMap = new Map(eventDetails.map((e) => [e.id, e]))

    const attendingEvents: AttendingEvent[] = attendanceRecords.map((a) => {
      const details = eventDetailsMap.get(a.eventId)
      return {
        id: a.id,
        eventId: a.eventId,
        eventName: a.eventName,
        timestamp: a.timestamp,
        category: details?.category,
        day: details?.day,
        time: details?.time,
        location: details?.location,
        imageUrl: details?.imageUrl,
        eventDate: details?.eventDate?.toISOString().split('T')[0] || null,
      }
    })

    // Process hosting events
    const hostedEventIds = hostedSubmissions.map((s) => s.id)

    // Get attendance counts for hosted events
    const attendanceCounts = hostedEventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          where: { eventId: { in: hostedEventIds } },
          _count: { id: true },
        })
      : []

    const countMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Split into upcoming and past events
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const allHostedEvents: HostingEvent[] = hostedSubmissions.map((s) => ({
      id: s.id,
      name: s.eventName,
      day: s.day,
      date: s.eventDate?.toISOString().split('T')[0] || null,
      time: s.time,
      location: s.location,
      imageUrl: s.imageUrl,
      category: s.category,
      recurring: s.recurring,
      goingCount: countMap.get(s.id) || 0,
      organizer: s.organizerInstagram,
    }))

    const upcomingHosted = allHostedEvents.filter((event) => {
      if (!event.date) return true // Recurring events are always upcoming
      return new Date(event.date) >= now
    })

    const pastHosted = allHostedEvents
      .filter((event) => {
        if (!event.date) return false
        return new Date(event.date) < now
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)

    // Calculate hosting stats
    const totalSignups = allHostedEvents.reduce((sum, e) => sum + e.goingCount, 0)

    // Get Stripe earnings if they have hosted events
    let totalEarnings = 0
    let paidAttendees = 0

    if (hostedEventIds.length > 0) {
      const [transactions, paidCount] = await Promise.all([
        prisma.eventTransaction.findMany({
          where: {
            eventSubmissionId: { in: hostedEventIds },
            status: 'SUCCEEDED',
          },
          select: { netPayoutToHost: true },
        }),
        prisma.eventAttendance.count({
          where: {
            eventId: { in: hostedEventIds },
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
          },
        }),
      ])

      totalEarnings = transactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0)
      paidAttendees = paidCount
    }

    const response: DashboardResponse = {
      attending: {
        events: attendingEvents,
        count: attendingEvents.length,
      },
      hosting: {
        events: upcomingHosted,
        pastEvents: pastHosted,
        stats: {
          activeEvents: upcomingHosted.length,
          totalSignups,
          totalEarnings,
          paidAttendees,
        },
      },
      isHost: hostedSubmissions.length > 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
