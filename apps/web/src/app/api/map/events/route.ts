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

    // Fetch approved EventSubmission events with coordinates
    const eventSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
        OR: [
          { eventDate: { gte: now, lte: endDate } },
          { recurring: true },
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
        startTime: { gte: now, lte: endDate },
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

    // Build unified response
    const events = [
      ...eventSubmissions.map((e) => ({
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
      })),
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
      })),
    ]

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
