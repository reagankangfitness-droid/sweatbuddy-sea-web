import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import neighborhoodsData from '@/data/neighborhoods.json'

export const dynamic = 'force-dynamic'

const HOT_THRESHOLD = 6 // Neighborhoods with >= 6 events are "hot"

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

    // Get all activities with their neighborhood IDs and attendee counts
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

    // Group activities by neighborhood
    const neighborhoodStats: Record<
      string,
      {
        events: typeof activities
        attendeeCount: number
      }
    > = {}

    activities.forEach((activity) => {
      const nId = activity.neighborhoodId || 'unknown'
      if (!neighborhoodStats[nId]) {
        neighborhoodStats[nId] = { events: [], attendeeCount: 0 }
      }
      neighborhoodStats[nId].events.push(activity)
      neighborhoodStats[nId].attendeeCount += activity._count.userActivities
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
    const totalEvents = activities.length
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
  } catch (error) {
    console.error('Error fetching map overview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map overview' },
      { status: 500 }
    )
  }
}
