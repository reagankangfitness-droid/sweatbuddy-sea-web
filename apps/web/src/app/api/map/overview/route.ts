import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import neighborhoodsData from '@/data/neighborhoods.json'

export const dynamic = 'force-dynamic'

const HOT_THRESHOLD = 6 // Neighborhoods with >= 6 events are "hot"

// Unified event type for merging Activity and EventSubmission
interface UnifiedEvent {
  id: string
  title: string
  neighborhoodId: string | null
  latitude: number | null
  longitude: number | null
  startTime: Date | null
  attendeeCount: number
  source: 'activity' | 'event_submission'
}

// Check if a point is within a neighborhood's bounds
function isPointInNeighborhood(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
}

// Find the best matching neighborhood for coordinates
function findNeighborhoodForCoordinates(lat: number, lng: number): string | null {
  for (const neighborhood of neighborhoodsData.neighborhoods) {
    if (isPointInNeighborhood(lat, lng, neighborhood.bounds)) {
      return neighborhood.id
    }
  }

  // If no exact match, find nearest neighborhood
  let nearestId: string | null = null
  let minDistance = Infinity

  for (const neighborhood of neighborhoodsData.neighborhoods) {
    const distance = Math.sqrt(
      Math.pow(lat - neighborhood.coordinates.lat, 2) +
        Math.pow(lng - neighborhood.coordinates.lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestId = neighborhood.id
    }
  }

  // Only assign if within reasonable distance
  return minDistance < 0.1 ? nearestId : null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'week'

    // Calculate date range
    const now = new Date()
    let endDate: Date

    switch (timeRange) {
      case 'today':
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekend':
        const dayOfWeek = now.getDay()
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
        endDate = new Date(now)
        endDate.setDate(now.getDate() + daysUntilSunday)
        endDate.setHours(23, 59, 59, 999)
        break
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

    // Get all activities with coordinates for dynamic matching
    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        startTime: {
          gte: now,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        neighborhoodId: true,
        latitude: true,
        longitude: true,
        startTime: true,
        _count: {
          select: {
            userActivities: {
              where: {
                status: 'JOINED',
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Also get EventSubmission events (approved events from admin)
    const eventSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          // Events with future dates
          { eventDate: { gte: now, lte: endDate } },
          // Recurring events (always show)
          { recurring: true },
        ]
      },
      select: {
        id: true,
        eventName: true,
        latitude: true,
        longitude: true,
        eventDate: true,
        time: true,
        recurring: true,
      },
      orderBy: { eventDate: 'asc' },
    })

    // Get attendance counts for EventSubmissions
    const eventIds = eventSubmissions.map(e => e.id)
    const attendanceCounts = eventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          _count: { id: true },
        })
      : []
    const attendanceMap = new Map(attendanceCounts.map(a => [a.eventId, a._count.id]))

    // Merge both sources into unified format
    const unifiedEvents: UnifiedEvent[] = [
      // Activities
      ...activities.map(a => ({
        id: a.id,
        title: a.title,
        neighborhoodId: a.neighborhoodId,
        latitude: a.latitude,
        longitude: a.longitude,
        startTime: a.startTime,
        attendeeCount: a._count.userActivities,
        source: 'activity' as const,
      })),
      // EventSubmissions (no neighborhoodId - use coordinates for matching)
      ...eventSubmissions.map(e => ({
        id: e.id,
        title: e.eventName,
        neighborhoodId: null, // EventSubmission doesn't have neighborhoodId, will match by coordinates
        latitude: e.latitude,
        longitude: e.longitude,
        startTime: e.eventDate,
        attendeeCount: attendanceMap.get(e.id) || 0,
        source: 'event_submission' as const,
      })),
    ]

    // Sort by startTime
    unifiedEvents.sort((a, b) => {
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.getTime() - b.startTime.getTime()
    })

    // Group unified events by neighborhood (using coordinates if neighborhoodId not set)
    const neighborhoodStats: Record<
      string,
      {
        events: UnifiedEvent[]
        attendeeCount: number
      }
    > = {}

    unifiedEvents.forEach((event) => {
      // Try to get neighborhood from neighborhoodId, or match by coordinates
      let nId = event.neighborhoodId
      if (!nId && event.latitude && event.longitude) {
        nId = findNeighborhoodForCoordinates(event.latitude, event.longitude)
      }
      nId = nId || 'unknown'

      if (!neighborhoodStats[nId]) {
        neighborhoodStats[nId] = { events: [], attendeeCount: 0 }
      }
      neighborhoodStats[nId].events.push(event)
      neighborhoodStats[nId].attendeeCount += event.attendeeCount
    })

    // Build neighborhood overview with event counts
    const neighborhoodOverviews = neighborhoodsData.neighborhoods.map((neighborhood) => {
      const stats = neighborhoodStats[neighborhood.id] || { events: [], attendeeCount: 0 }
      const nextEvent = stats.events[0]

      return {
        id: neighborhood.id,
        name: neighborhood.name,
        shortName: neighborhood.shortName,
        mapPosition: neighborhood.mapPosition,
        vibe: neighborhood.vibe,
        description: neighborhood.description,
        eventCount: stats.events.length,
        attendeeCount: stats.attendeeCount,
        isHot: stats.events.length >= HOT_THRESHOLD,
        nextEvent: nextEvent
          ? {
              title: nextEvent.title,
              datetime: nextEvent.startTime?.toISOString() || '',
            }
          : undefined,
      }
    })

    // Find hot spot (neighborhood with most events)
    const sortedByEvents = [...neighborhoodOverviews].sort(
      (a, b) => b.eventCount - a.eventCount
    )
    const hotSpot = sortedByEvents[0]?.eventCount > 0 ? sortedByEvents[0] : null

    // Calculate totals
    const totalEvents = unifiedEvents.length
    const totalAttendees = Object.values(neighborhoodStats).reduce(
      (sum, stats) => sum + stats.attendeeCount,
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        neighborhoods: neighborhoodOverviews,
        summary: {
          totalEvents,
          totalAttendees,
          hotSpot: hotSpot
            ? {
                id: hotSpot.id,
                name: hotSpot.name,
              }
            : null,
        },
        timeRange,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map overview' },
      { status: 500 }
    )
  }
}
