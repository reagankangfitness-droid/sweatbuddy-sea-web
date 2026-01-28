import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'month'

    const now = new Date()
    let endDate: Date

    switch (timeRange) {
      case 'today':
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekend': {
        const dayOfWeek = now.getDay()
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
        endDate = new Date(now)
        endDate.setDate(now.getDate() + daysUntilSunday)
        endDate.setHours(23, 59, 59, 999)
        break
      }
      case 'month':
        endDate = new Date(now)
        endDate.setMonth(now.getMonth() + 1)
        break
      case 'week':
      default:
        endDate = new Date(now)
        endDate.setDate(now.getDate() + 7)
        break
    }

    // Engagement-optimized: Show events from today through next 14 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

    // Fetch upcoming EventSubmission events with coordinates
    const eventSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
        OR: [
          { recurring: true }, // Recurring = always show
          { eventDate: { gte: today, lte: twoWeeksFromNow } }, // One-time within 2 weeks
          { eventDate: null }, // No date = show it
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

    // Also fetch Activity events with coordinates (upcoming within 2 weeks)
    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        latitude: { not: 0 },
        longitude: { not: 0 },
        OR: [
          { startTime: null },
          { startTime: { gte: today, lte: twoWeeksFromNow } },
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

    // Helper functions for engagement signals
    const isToday = (date: Date | null) => {
      if (!date) return false
      return new Date(date).toDateString() === today.toDateString()
    }

    const isThisWeekend = (date: Date | null) => {
      if (!date) return false
      const d = new Date(date)
      const dayOfWeek = d.getDay()
      const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return (dayOfWeek === 0 || dayOfWeek === 6) && daysUntil <= 7
    }

    // Get next occurrence for recurring events
    const getNextOccurrence = (day: string) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const targetDay = days.findIndex(d => d.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)))
      if (targetDay === -1) return null
      const todayDay = today.getDay()
      let daysUntil = targetDay - todayDay
      if (daysUntil < 0) daysUntil += 7
      if (daysUntil === 0) return today
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysUntil)
      return nextDate
    }

    // Build unified response with engagement signals
    const events = [
      ...eventSubmissions.map((e) => {
        const effectiveDate = e.recurring && !e.eventDate
          ? getNextOccurrence(e.day)
          : e.eventDate
        return {
          id: e.id,
          slug: e.slug,
          name: e.eventName,
          category: e.category,
          imageUrl: e.imageUrl,
          latitude: e.latitude!,
          longitude: e.longitude!,
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
          isHappeningToday: isToday(effectiveDate),
          isThisWeekend: isThisWeekend(effectiveDate),
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
        time: a.startTime?.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) || '',
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
        isHappeningToday: isToday(a.startTime),
        isThisWeekend: isThisWeekend(a.startTime),
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
        timeRange,
      },
    })
  } catch (error) {
    console.error('Error fetching map events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map events' },
      { status: 500 }
    )
  }
}
