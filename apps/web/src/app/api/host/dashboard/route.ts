import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface DashboardEvent {
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

export async function GET() {
  try {
    // Check authentication
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle

    // Get all events for this organizer from submissions
    const submissions = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          equals: instagramHandle,
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
    })

    // Get attendance counts for all events
    const eventIds = submissions.map((s) => s.id)
    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    })

    const countMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Split into upcoming and past events
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const allEvents: DashboardEvent[] = submissions.map((s) => ({
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

    // For recurring events without a date, consider them as upcoming
    const upcoming = allEvents.filter((event) => {
      if (!event.date) return true // Recurring events are always upcoming
      return new Date(event.date) >= now
    })

    const past = allEvents
      .filter((event) => {
        if (!event.date) return false // Recurring events are not in past
        return new Date(event.date) < now
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA // Sort descending (newest first)
      })
      .slice(0, 5) // Limit to 5

    // Calculate stats
    const totalSignups = allEvents.reduce((sum, e) => sum + e.goingCount, 0)

    // Get total Stripe earnings for this organizer's events
    const eventTransactions = await prisma.eventTransaction.findMany({
      where: {
        eventSubmissionId: { in: eventIds },
        status: 'SUCCEEDED',
      },
      select: {
        netPayoutToHost: true,
        totalCharged: true,
        currency: true,
      },
    })

    // Calculate totals (in cents)
    const totalEarnings = eventTransactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0)
    const totalRevenue = eventTransactions.reduce((sum, t) => sum + (t.totalCharged || 0), 0)

    // Get count of paid attendees
    const paidAttendeesCount = await prisma.eventAttendance.count({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
      },
    })

    return NextResponse.json({
      stats: {
        activeEvents: upcoming.length,
        totalSignups,
        totalEarnings, // in cents
        totalRevenue,  // in cents
        paidAttendees: paidAttendeesCount,
      },
      upcoming,
      past,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
