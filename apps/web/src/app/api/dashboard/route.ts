import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
    const now = new Date()

    // Get user's upcoming events (events they're attending)
    const attendanceRecords = await prisma.eventAttendance.findMany({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
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
    })

    const attendingEventIds = attendanceRecords.map((a) => a.eventId)

    // Get full event details for attending events
    const eventDetails = attendingEventIds.length > 0
      ? await prisma.eventSubmission.findMany({
          where: {
            id: { in: attendingEventIds },
            status: 'APPROVED',
          },
          select: {
            id: true,
            eventName: true,
            category: true,
            day: true,
            time: true,
            location: true,
            imageUrl: true,
            eventDate: true,
            recurring: true,
            organizerInstagram: true,
            organizerName: true,
            slug: true,
          },
        })
      : []

    const eventDetailsMap = new Map(eventDetails.map((e) => [e.id, e]))

    // Build upcoming events list (future events only)
    const upcomingEvents = attendanceRecords
      .map((a) => {
        const details = eventDetailsMap.get(a.eventId)
        if (!details) return null

        const eventDate = details.eventDate
        const isUpcoming = !eventDate || new Date(eventDate) >= now || details.recurring

        if (!isUpcoming) return null

        return {
          id: a.eventId,
          name: details.eventName,
          category: details.category,
          day: details.day,
          time: details.time,
          location: details.location,
          imageUrl: details.imageUrl,
          date: eventDate?.toISOString().split('T')[0] || null,
          recurring: details.recurring,
          organizer: details.organizerName || details.organizerInstagram,
          slug: details.slug,
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by date, recurring events last
        if (!a!.date && !b!.date) return 0
        if (!a!.date) return 1
        if (!b!.date) return -1
        return new Date(a!.date).getTime() - new Date(b!.date).getTime()
      })
      .slice(0, 5)

    // Get the next event (first upcoming) for spotlight
    const nextEvent = upcomingEvents[0] || null

    // Check if user is a host
    const hostEventCount = await prisma.eventSubmission.count({
      where: {
        contactEmail: { equals: normalizedEmail, mode: 'insensitive' },
        status: 'APPROVED',
      },
    })
    const isHost = hostEventCount > 0

    // Get discover events (events happening this week that user is NOT attending)
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const discoverEvents = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        id: { notIn: attendingEventIds.length > 0 ? attendingEventIds : ['none'] },
        OR: [
          {
            eventDate: {
              gte: now,
              lte: weekFromNow,
            },
          },
          {
            recurring: true,
          },
        ],
      },
      orderBy: { eventDate: 'asc' },
      take: 6,
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        time: true,
        location: true,
        imageUrl: true,
        eventDate: true,
        recurring: true,
        organizerInstagram: true,
        organizerName: true,
        slug: true,
      },
    })

    // Get attendance counts for discover events
    const discoverEventIds = discoverEvents.map((e) => e.id)
    const discoverCounts = discoverEventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          where: { eventId: { in: discoverEventIds } },
          _count: { id: true },
        })
      : []

    const discoverCountMap = new Map(discoverCounts.map((c) => [c.eventId, c._count.id]))

    const formattedDiscover = discoverEvents.map((e) => ({
      id: e.id,
      name: e.eventName,
      category: e.category,
      day: e.day,
      time: e.time,
      location: e.location,
      imageUrl: e.imageUrl,
      date: e.eventDate?.toISOString().split('T')[0] || null,
      recurring: e.recurring,
      organizer: e.organizerName || e.organizerInstagram,
      slug: e.slug,
      goingCount: discoverCountMap.get(e.id) || 0,
    }))

    return NextResponse.json({
      nextEvent,
      upcomingEvents,
      upcomingCount: upcomingEvents.length,
      discover: formattedDiscover,
      isHost,
      userName: user?.firstName || user?.fullName || 'there',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
