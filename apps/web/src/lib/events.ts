import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

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

// Generate URL-friendly slug from event name and date
export function generateSlug(name: string, eventDate?: string | null): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove consecutive hyphens
    .substring(0, 50)         // Limit length

  // Add date suffix if available for uniqueness
  if (eventDate) {
    const date = new Date(eventDate)
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
    const day = date.getDate()
    return `${baseSlug}-${month}-${day}`
  }

  return baseSlug
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

// Fetch single event by ID or slug - no caching for dynamic rendering
export async function getEventById(idOrSlug: string): Promise<Event | null> {
  try {
    // Try to find by ID first, then by slug
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
  } catch (error) {
    console.error('Error fetching event by ID or slug:', error)
    return null
  }
}
