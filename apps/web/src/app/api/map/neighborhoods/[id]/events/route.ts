import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import neighborhoodsData from '@/data/neighborhoods.json'

export const dynamic = 'force-dynamic'

const AVATAR_COLORS = [
  'bg-blue-200',
  'bg-green-200',
  'bg-purple-200',
  'bg-pink-200',
  'bg-yellow-200',
  'bg-orange-200',
  'bg-teal-200',
  'bg-indigo-200',
]

// Check if a point is within a neighborhood's bounds
function isPointInNeighborhood(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const neighborhoodId = params.id
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'week'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    // Find neighborhood
    const neighborhood = neighborhoodsData.neighborhoods.find(
      (n) => n.id === neighborhoodId
    )

    if (!neighborhood) {
      return NextResponse.json(
        { success: false, error: 'Neighborhood not found' },
        { status: 404 }
      )
    }

    // Calculate date range
    const now = new Date()
    let endDate: Date

    switch (timeRange) {
      case 'today':
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekend':
        // Find next Sunday
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

    // Build query filters - match by neighborhoodId OR by coordinates within bounds
    const whereClause: any = {
      status: 'PUBLISHED',
      startTime: {
        gte: now,
        lte: endDate,
      },
      OR: [
        { neighborhoodId: neighborhoodId },
        {
          AND: [
            { neighborhoodId: null },
            { latitude: { gte: neighborhood.bounds.south, lte: neighborhood.bounds.north } },
            { longitude: { gte: neighborhood.bounds.west, lte: neighborhood.bounds.east } },
          ],
        },
      ],
    }

    if (category) {
      whereClause.categorySlug = category
    }

    if (cursor) {
      whereClause.id = { gt: cursor }
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        startTime: true,
        categorySlug: true,
        imageUrl: true,
        price: true,
        maxPeople: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
        userActivities: {
          where: {
            status: 'JOINED',
          },
          select: {
            user: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
          take: 5,
        },
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
      take: limit + 1, // Get one extra to check if there's more
    })

    // Check if there's more
    const hasMore = activities.length > limit
    const eventsToReturn = hasMore ? activities.slice(0, limit) : activities

    // Transform to response format
    const events = eventsToReturn.map((activity) => {
      const attendees = activity.userActivities || []
      const attendeeAvatars = attendees.slice(0, 3).map((ua, i) => ({
        initial: ua.user.name?.charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }))

      // Handle optional user relation
      const host = activity.user
        ? {
            id: activity.user.id,
            name: activity.user.name || 'Unknown',
            handle: activity.user.username ? `@${activity.user.username}` : '@host',
            avatar: activity.user.imageUrl || undefined,
          }
        : {
            id: 'unknown',
            name: 'Unknown Host',
            handle: '@host',
            avatar: undefined,
          }

      return {
        id: activity.id,
        slug: activity.id, // Using ID as slug for now
        title: activity.title,
        host,
        datetime: activity.startTime?.toISOString() || new Date().toISOString(),
        category: activity.categorySlug || 'Fitness',
        image: activity.imageUrl || undefined,
        price: activity.price && activity.price > 0 ? activity.price : null,
        isRecurring: false, // Would need to add this field to Activity model
        location: {
          name: activity.address || neighborhood.popularVenues[0] || neighborhood.name,
        },
        attendeeCount: activity._count.userActivities,
        capacity: activity.maxPeople || undefined,
        attendeeAvatars,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        neighborhood: {
          id: neighborhood.id,
          name: neighborhood.name,
          vibe: neighborhood.vibe,
          description: neighborhood.description,
        },
        events,
        pagination: {
          hasMore,
          cursor: hasMore ? eventsToReturn[eventsToReturn.length - 1].id : null,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching neighborhood events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch neighborhood events' },
      { status: 500 }
    )
  }
}
