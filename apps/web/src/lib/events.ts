import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

export interface SocialProofStats {
  peopleMovedThisWeek: number
  eventsLive: number
  activeHosts: number
}

// Cached social proof stats - revalidates every 60s
const getCachedSocialProofStats = unstable_cache(
  async (): Promise<SocialProofStats> => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [peopleMovedThisWeek, eventsLive, activeHosts] = await Promise.all([
      // Count RSVPs in the last 7 days
      prisma.eventAttendance.count({
        where: {
          timestamp: { gte: oneWeekAgo },
        },
      }),
      // Count upcoming approved events only
      prisma.eventSubmission.count({
        where: {
          status: 'APPROVED',
          OR: [
            { eventDate: { gte: today } },
            { recurring: true },
            { eventDate: null, recurring: true }
          ]
        },
      }),
      // Count unique hosts with upcoming approved events
      prisma.eventSubmission.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { eventDate: { gte: today } },
            { recurring: true },
            { eventDate: null, recurring: true }
          ]
        },
        select: { organizerInstagram: true },
        distinct: ['organizerInstagram'],
      }).then(hosts => hosts.length),
    ])

    return { peopleMovedThisWeek, eventsLive, activeHosts }
  },
  ['social-proof-stats-v2'], // New cache key
  { revalidate: 60, tags: ['events'] }
)

export async function getSocialProofStats(): Promise<SocialProofStats> {
  try {
    return await getCachedSocialProofStats()
  } catch {
    return { peopleMovedThisWeek: 0, eventsLive: 0, activeHosts: 0 }
  }
}

export interface Event {
  id: string
  slug?: string | null  // URL-friendly slug (e.g., "coffee-run-dec-27")
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  latitude?: number | null
  longitude?: number | null
  description: string | null
  organizer: string
  organizerName?: string | null
  organizerImageUrl?: string | null
  imageUrl: string | null
  communityLink?: string | null
  recurring: boolean
  goingCount?: number
  isFull?: boolean
  // Pricing fields
  isFree?: boolean
  price?: number | null
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
  paynowName?: string | null
  stripeEnabled?: boolean
  // Source type
  isActivity?: boolean
}

// Generate URL-friendly slug from event name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove consecutive hyphens
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .substring(0, 50)         // Limit length
}

// Helper to check if an event should be shown
// - Recurring events: ALWAYS show (they repeat weekly)
// - One-time events: Show all future events (filtering happens on frontend via tabs)
function isUpcomingEvent(eventDate: Date | null, recurring: boolean): boolean {
  // RECURRING EVENTS: Always show - they happen every week on their designated day
  if (recurring) return true

  // Events without a date - show them (legacy data)
  if (!eventDate) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDay = new Date(eventDate)
  eventDay.setHours(0, 0, 0, 0)

  // ONE-TIME EVENTS: Show all future events (today and onwards)
  // Frontend will filter by date tabs (Today, Tomorrow, This weekend, Next week, etc.)
  return eventDay >= today
}

// Cached database fetch for events - revalidates every 60s
const getCachedEvents = unstable_cache(
  async () => {
    // Get today's date at midnight for filtering
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const now = new Date()

    // Get approved events that are upcoming or recurring
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        // Only show events that are either not scheduled or whose publish time has passed
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              // Events with future dates
              { eventDate: { gte: today } },
              // Recurring events (always show)
              { recurring: true },
              // Events without dates (legacy, show them)
              { eventDate: null, recurring: true }
            ]
          }
        ]
      },
      orderBy: { eventDate: 'asc' }, // Sort by event date, soonest first
      select: {
        id: true,
        slug: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        description: true,
        organizerInstagram: true,
        imageUrl: true,
        communityLink: true,
        recurring: true,
        isFull: true,
        // Pricing fields
        isFree: true,
        price: true,
        paynowEnabled: true,
        paynowQrCode: true,
        paynowNumber: true,
      },
    })

    // Get attendance counts for all events in one query
    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      _count: { id: true },
    })

    // Create a map for quick lookup
    const countMap = new Map(
      attendanceCounts.map(item => [item.eventId, item._count.id])
    )

    // Filter out past recurring events (recurring events with past specific dates)
    const upcomingEvents = approvedSubmissions.filter(submission =>
      isUpcomingEvent(submission.eventDate, submission.recurring)
    )

    return upcomingEvents.map(submission => ({
      id: submission.id,
      slug: submission.slug,
      name: submission.eventName,
      category: submission.category,
      day: submission.day,
      eventDate: submission.eventDate?.toISOString().split('T')[0] || null,
      time: submission.time,
      location: submission.location,
      description: submission.description,
      organizer: submission.organizerInstagram,
      imageUrl: submission.imageUrl,
      communityLink: submission.communityLink,
      recurring: submission.recurring,
      isFull: submission.isFull,
      goingCount: countMap.get(submission.id) || 0,
      // Pricing fields
      isFree: submission.isFree,
      price: submission.price,
      paynowEnabled: submission.paynowEnabled,
      paynowQrCode: submission.paynowQrCode,
      paynowNumber: submission.paynowNumber,
    }))
  },
  ['events-list-home-v3'], // Updated cache key - now returns all future events
  { revalidate: 60, tags: ['events'] }
)

export async function getEvents(): Promise<Event[]> {
  try {
    return await getCachedEvents()
  } catch {
    return []
  }
}

// Cached event fetch - revalidates every 30 seconds
// Supports both EventSubmission and Activity records
const getCachedEventById = unstable_cache(
  async (idOrSlug: string): Promise<Event | null> => {
    const now = new Date()

    // First, try EventSubmission table
    const submission = await prisma.eventSubmission.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ],
        status: 'APPROVED',
        AND: [
          {
            OR: [
              { scheduledPublishAt: null },
              { scheduledPublishAt: { lte: now } },
            ]
          }
        ]
      },
      select: {
        id: true,
        slug: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        latitude: true,
        longitude: true,
        description: true,
        organizerInstagram: true,
        organizerName: true,
        imageUrl: true,
        communityLink: true,
        recurring: true,
        isFull: true,
        isFree: true,
        price: true,
        paynowEnabled: true,
        paynowQrCode: true,
        paynowNumber: true,
        paynowName: true,
        stripeEnabled: true,
      },
    })

    if (submission) {
      return {
        id: submission.id,
        slug: submission.slug,
        name: submission.eventName,
        category: submission.category,
        day: submission.day,
        eventDate: submission.eventDate?.toISOString().split('T')[0] || null,
        time: submission.time,
        location: submission.location,
        latitude: submission.latitude,
        longitude: submission.longitude,
        description: submission.description,
        organizer: submission.organizerInstagram || submission.organizerName,
        organizerName: submission.organizerName,
        imageUrl: submission.imageUrl,
        communityLink: submission.communityLink,
        recurring: submission.recurring,
        isFull: submission.isFull,
        isFree: submission.isFree,
        price: submission.price,
        paynowEnabled: submission.paynowEnabled,
        paynowQrCode: submission.paynowQrCode,
        paynowNumber: submission.paynowNumber,
        paynowName: submission.paynowName,
        stripeEnabled: submission.stripeEnabled,
        isActivity: false,
      }
    }

    // If not found in EventSubmission, try Activity table
    const activity = await prisma.activity.findFirst({
      where: {
        id: idOrSlug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          }
        },
        _count: {
          select: {
            userActivities: { where: { status: 'JOINED' } }
          }
        }
      }
    })

    if (activity) {
      const startDate = activity.startTime ? new Date(activity.startTime) : null
      const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
      const sgTZ = { timeZone: 'Asia/Singapore' } as const

      // Get day of week in Singapore timezone
      const sgDayIndex = startDate
        ? new Date(startDate.toLocaleString('en-US', sgTZ)).getDay()
        : -1

      return {
        id: activity.id,
        slug: null,
        name: activity.title,
        category: activity.type || activity.categorySlug || 'Fitness',
        day: sgDayIndex >= 0 ? dayNames[sgDayIndex] : '',
        eventDate: startDate ? startDate.toLocaleDateString('en-CA', sgTZ) : null,
        time: startDate?.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', ...sgTZ }) || '',
        location: activity.address || activity.city || '',
        latitude: activity.latitude,
        longitude: activity.longitude,
        description: activity.description,
        organizer: activity.user.name || 'Host',
        organizerName: activity.user.name,
        organizerImageUrl: activity.user.imageUrl,
        imageUrl: activity.imageUrl,
        communityLink: null,
        recurring: false,
        isFull: activity.maxPeople ? activity._count.userActivities >= activity.maxPeople : false,
        isFree: activity.price === 0,
        price: activity.price ? Math.round(activity.price * 100) : null, // Convert to cents
        paynowEnabled: false,
        paynowQrCode: null,
        paynowNumber: null,
        paynowName: null,
        stripeEnabled: activity.price > 0,
        isActivity: true,
        goingCount: activity._count.userActivities,
      }
    }

    return null
  },
  ['event-by-id-v2'],
  { revalidate: 30, tags: ['events'] }
)

// Fetch single event by ID or slug with caching
export async function getEventById(idOrSlug: string): Promise<Event | null> {
  try {
    return await getCachedEventById(idOrSlug)
  } catch {
    return null
  }
}

// Cached going count - revalidates every 30 seconds
const getCachedGoingCount = unstable_cache(
  async (eventId: string): Promise<number> => {
    return await prisma.eventAttendance.count({
      where: { eventId }
    })
  },
  ['event-going-count'],
  { revalidate: 30, tags: ['attendance'] }
)

// Get event going count with caching
export async function getEventGoingCount(eventId: string): Promise<number> {
  try {
    return await getCachedGoingCount(eventId)
  } catch {
    return 0
  }
}
