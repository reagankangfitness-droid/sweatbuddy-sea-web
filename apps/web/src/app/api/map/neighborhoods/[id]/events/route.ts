import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import neighborhoodsData from '@/data/neighborhoods.json'
import { getNextOccurrenceSG, combineDateTimeSG } from '@/lib/event-dates'

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

// Unified event response type
interface UnifiedEventResponse {
  id: string
  slug: string
  title: string
  host: {
    id: string
    name: string
    handle: string
    avatar?: string
  }
  datetime: string
  category: string
  image?: string
  price: number | null
  isRecurring: boolean
  location: { name: string }
  attendeeCount: number
  capacity?: number
  attendeeAvatars: { initial: string; color: string }[]
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


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: neighborhoodId } = await params
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    const now = new Date()

    // Build query filters for Activities
    const activityWhereClause: any = {
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { startTime: null },
            { startTime: { gte: now } },
          ],
        },
        {
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
        },
      ],
    }

    if (category) {
      activityWhereClause.categorySlug = category
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: activityWhereClause,
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
          where: { status: 'JOINED' },
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
              where: { status: 'JOINED' },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Fetch EventSubmissions for this neighborhood (match by coordinates only)
    const eventSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        // Match by coordinates within bounds
        latitude: { gte: neighborhood.bounds.south, lte: neighborhood.bounds.north },
        longitude: { gte: neighborhood.bounds.west, lte: neighborhood.bounds.east },
        OR: [
          { eventDate: { gte: now } },
          { recurring: true },
          { eventDate: null, recurring: true },
        ]
      },
      select: {
        id: true,
        slug: true,
        eventName: true,
        eventDate: true,
        day: true,
        time: true,
        category: true,
        imageUrl: true,
        price: true,
        isFree: true,
        maxTickets: true,
        location: true,
        organizerInstagram: true,
        organizerName: true,
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

    // Get attendee previews for EventSubmissions
    const attendeePreviews = eventIds.length > 0
      ? await prisma.eventAttendance.findMany({
          where: { eventId: { in: eventIds } },
          select: {
            eventId: true,
            name: true,
          },
          take: 50,
        })
      : []

    // Group attendees by event
    const eventAttendeesMap = new Map<string, string[]>()
    attendeePreviews.forEach(a => {
      const list = eventAttendeesMap.get(a.eventId) || []
      if (list.length < 3) list.push(a.name || 'Guest')
      eventAttendeesMap.set(a.eventId, list)
    })

    // Transform activities to unified format
    const activityEvents: UnifiedEventResponse[] = activities.map((activity) => {
      const attendees = activity.userActivities || []
      const attendeeAvatars = attendees.slice(0, 3).map((ua, i) => ({
        initial: ua.user.name?.charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }))

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
        slug: activity.id,
        title: activity.title,
        host,
        datetime: activity.startTime?.toISOString() || new Date().toISOString(),
        category: activity.categorySlug || 'Fitness',
        image: activity.imageUrl || undefined,
        price: activity.price && activity.price > 0 ? activity.price : null,
        isRecurring: false,
        location: { name: activity.address || neighborhood.popularVenues[0] || neighborhood.name },
        attendeeCount: activity._count.userActivities,
        capacity: activity.maxPeople || undefined,
        attendeeAvatars,
        source: 'activity' as const,
      }
    })

    // Transform EventSubmissions to unified format
    const submissionEvents: UnifiedEventResponse[] = eventSubmissions
      .map((event) => {
        const attendeeNames = eventAttendeesMap.get(event.id) || []
        const attendeeAvatars = attendeeNames.slice(0, 3).map((name, i) => ({
          initial: name.charAt(0).toUpperCase() || '?',
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        }))

        // For recurring events, use next occurrence instead of stored eventDate
        const nextDate = event.recurring
          ? (getNextOccurrenceSG(event.day || '') ?? event.eventDate)
          : event.eventDate

        // Combine date and time
        const datetime = nextDate && event.time
          ? combineDateTimeSG(nextDate, event.time) ?? nextDate
          : nextDate || new Date()

        return {
          id: event.id,
          slug: event.slug || event.id,
          title: event.eventName,
          host: {
            id: event.organizerInstagram || 'unknown',
            name: event.organizerName || event.organizerInstagram || 'Unknown Host',
            handle: event.organizerInstagram ? `@${event.organizerInstagram}` : '@host',
            avatar: undefined,
          },
          datetime: datetime.toISOString(),
          category: event.category || 'Fitness',
          image: event.imageUrl || undefined,
          price: event.isFree ? null : (event.price ? event.price / 100 : null), // Convert cents to dollars
          isRecurring: event.recurring,
          location: { name: event.location || neighborhood.name },
          attendeeCount: attendanceMap.get(event.id) || 0,
          capacity: event.maxTickets || undefined,
          attendeeAvatars,
          source: 'event_submission' as const,
        }
      })

    // Merge and sort by datetime
    const allEvents = [...activityEvents, ...submissionEvents].sort((a, b) => {
      return new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    })

    // Apply limit
    const eventsToReturn = allEvents.slice(0, limit)
    const hasMore = allEvents.length > limit

    return NextResponse.json({
      success: true,
      data: {
        neighborhood: {
          id: neighborhood.id,
          name: neighborhood.name,
          vibe: neighborhood.vibe,
          description: neighborhood.description,
        },
        events: eventsToReturn,
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
