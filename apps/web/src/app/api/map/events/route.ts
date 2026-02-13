import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSGToday, isTodaySG, isThisWeekendSG, getNextOccurrenceSG } from '@/lib/event-dates'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Show all approved events: recurring (always) + all future one-time events
    const today = getSGToday()

    // Fetch upcoming EventSubmission events with coordinates
    const now = new Date()

    const eventSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
        AND: [
          {
            OR: [
              { scheduledPublishAt: null },
              { scheduledPublishAt: { lte: now } },
            ],
          },
          {
            OR: [
              { recurring: true },
              { eventDate: { gte: today } },
              { eventDate: null },
            ],
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        eventName: true,
        category: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        day: true,
        time: true,
        location: true,
        eventDate: true,
        recurring: true,
        organizerName: true,
        isFree: true,
        price: true,
        isFull: true,
        description: true,
      },
      orderBy: { eventDate: 'asc' },
    })

    // Get attendance counts
    const eventIds = eventSubmissions.map((e) => e.id)
    const attendanceCounts =
      eventIds.length > 0
        ? await prisma.eventAttendance.groupBy({
            by: ['eventId'],
            where: { eventId: { in: eventIds } },
            _count: { id: true },
          })
        : []
    const attendanceMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Also fetch Activity events with coordinates
    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        latitude: { not: 0 },
        longitude: { not: 0 },
        OR: [
          { startTime: null },
          { startTime: { gte: today } },
        ],
      },
      select: {
        id: true,
        title: true,
        categorySlug: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        startTime: true,
        address: true,
        description: true,
        _count: {
          select: {
            userActivities: { where: { status: 'JOINED' } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Date helpers imported from @/lib/event-dates

    // Build unified response with engagement signals
    const events = [
      ...eventSubmissions.map((e) => {
        // For recurring events, always calculate next occurrence from day name
        const effectiveDate = e.recurring
          ? getNextOccurrenceSG(e.day) ?? e.eventDate
          : e.eventDate
        return {
          id: e.id,
          slug: e.slug,
          name: e.eventName,
          category: e.category,
          imageUrl: e.imageUrl,
          latitude: e.latitude ?? null,
          longitude: e.longitude ?? null,
          day: e.day,
          time: e.time,
          location: e.location,
          eventDate: e.eventDate?.toISOString() ?? null,
          recurring: e.recurring,
          organizer: e.organizerName,
          isFree: e.isFree,
          price: e.price,
          isFull: e.isFull,
          description: e.description,
          goingCount: attendanceMap.get(e.id) || 0,
          source: 'event_submission' as const,
          // Engagement signals
          isHappeningToday: isTodaySG(effectiveDate),
          isThisWeekend: isThisWeekendSG(effectiveDate),
        }
      }),
      ...activities.map((a) => ({
        id: a.id,
        slug: null,
        name: a.title,
        category: a.categorySlug || '',
        imageUrl: a.imageUrl,
        latitude: a.latitude,
        longitude: a.longitude,
        day: '',
        time: a.startTime?.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) || '',
        location: a.address || '',
        eventDate: a.startTime?.toISOString() ?? null,
        recurring: false,
        organizer: '',
        isFree: true,
        price: null,
        isFull: false,
        description: a.description,
        goingCount: a._count.userActivities,
        source: 'activity' as const,
        // Engagement signals
        isHappeningToday: isTodaySG(a.startTime),
        isThisWeekend: isThisWeekendSG(a.startTime),
      })),
    ].sort((a, b) => {
      // Today's events first (dopamine hit - "I could go NOW")
      if (a.isHappeningToday && !b.isHappeningToday) return -1
      if (!a.isHappeningToday && b.isHappeningToday) return 1
      // Weekend events second (planning trigger)
      if (a.isThisWeekend && !b.isThisWeekend) return -1
      if (!a.isThisWeekend && b.isThisWeekend) return 1
      // Then by popularity (social proof)
      return (b.goingCount || 0) - (a.goingCount || 0)
    })

    return NextResponse.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map events' },
      { status: 500 }
    )
  }
}
