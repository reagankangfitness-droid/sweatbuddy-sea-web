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

    const [peopleMovedThisWeek, eventsLive, activeHosts] = await Promise.all([
      // Count RSVPs in the last 7 days
      prisma.eventAttendance.count({
        where: {
          timestamp: { gte: oneWeekAgo },
        },
      }),
      // Count approved events
      prisma.eventSubmission.count({
        where: { status: 'APPROVED' },
      }),
      // Count unique hosts with approved events
      prisma.eventSubmission.findMany({
        where: { status: 'APPROVED' },
        select: { organizerInstagram: true },
        distinct: ['organizerInstagram'],
      }).then(hosts => hosts.length),
    ])

    return { peopleMovedThisWeek, eventsLive, activeHosts }
  },
  ['social-proof-stats'],
  { revalidate: 60, tags: ['events'] }
)

export async function getSocialProofStats(): Promise<SocialProofStats> {
  try {
    return await getCachedSocialProofStats()
  } catch (error) {
    console.error('Error fetching social proof stats:', error)
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
  description: string | null
  organizer: string
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

// Cached database fetch for events - revalidates every 60s
const getCachedEvents = unstable_cache(
  async () => {
    // Get approved events
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
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

    return approvedSubmissions.map(submission => ({
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
    }))
  },
  ['events-list-home'],
  { revalidate: 60, tags: ['events'] }
)

export async function getEvents(): Promise<Event[]> {
  try {
    return await getCachedEvents()
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

// Cached event fetch - revalidates every 30 seconds
const getCachedEventById = unstable_cache(
  async (idOrSlug: string): Promise<Event | null> => {
    const submission = await prisma.eventSubmission.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ],
        status: 'APPROVED'
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
        description: submission.description,
        organizer: submission.organizerInstagram,
        imageUrl: submission.imageUrl,
        communityLink: submission.communityLink,
        recurring: submission.recurring,
        isFull: submission.isFull,
        // Pricing fields
        isFree: submission.isFree,
        price: submission.price,
        paynowEnabled: submission.paynowEnabled,
        paynowQrCode: submission.paynowQrCode,
        paynowNumber: submission.paynowNumber,
        paynowName: submission.paynowName,
        stripeEnabled: submission.stripeEnabled,
      }
    }

    return null
  },
  ['event-by-id'],
  { revalidate: 30, tags: ['events'] }
)

// Fetch single event by ID or slug with caching
export async function getEventById(idOrSlug: string): Promise<Event | null> {
  try {
    return await getCachedEventById(idOrSlug)
  } catch (error) {
    console.error('Error fetching event by ID or slug:', error)
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
  } catch (error) {
    console.error('Error fetching going count:', error)
    return 0
  }
}
