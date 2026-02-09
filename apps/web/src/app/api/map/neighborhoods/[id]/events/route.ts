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

// Parse time string like "7:00PM" or "6:30 PM" to hours and minutes
function parseTimeString(time: string): { hours: number; minutes: number } {
  const match = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i)
  if (!match) return { hours: 9, minutes: 0 } // Default to 9 AM

  let hours = parseInt(match[1])
  const minutes = match[2] ? parseInt(match[2]) : 0
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return { hours, minutes }
}

// Combine eventDate and time string into a Date
function combineDateTime(eventDate: Date, timeString: string): Date {
  const { hours, minutes } = parseTimeString(timeString)
  const combined = new Date(eventDate)
  combined.setHours(hours, minutes, 0, 0)
  return combined
}

// Get next occurrence for recurring events based on day name
function getNextOccurrence(day: string): Date | null {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = days.findIndex(d => d.toLowerCase().startsWith(day.toLowerCase().replace('every ', '').trim().slice(0, 3)))
  if (targetDay === -1) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDay = today.getDay()
  let daysUntil = targetDay - todayDay
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0) return today
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntil)
  return nextDate
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: neighborhoodId } = await params
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'week'
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

    // Build query filters for Activities
    const activityWhereClause: any = {
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
        // Date filtering
        OR: [
          { eventDate: { gte: now, lte: endDate } },
          { recurring: true },
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
      .filter(e => {
        // Recurring events always show — they repeat weekly
        if (e.recurring) return true
        // One-time events must have a future date within range
        return e.eventDate && e.eventDate >= now && e.eventDate <= endDate
      })
      .map((event) => {
        const attendeeNames = eventAttendeesMap.get(event.id) || []
        const attendeeAvatars = attendeeNames.slice(0, 3).map((name, i) => ({
          initial: name.charAt(0).toUpperCase() || '?',
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        }))

        // For recurring events, use next occurrence instead of stored eventDate
        const nextDate = event.recurring
          ? (getNextOccurrence(event.day || '') ?? event.eventDate)
          : event.eventDate

        // Combine date and time
        const datetime = nextDate && event.time
          ? combineDateTime(nextDate, event.time)
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
