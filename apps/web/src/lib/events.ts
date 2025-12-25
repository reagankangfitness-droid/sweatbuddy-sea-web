import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

export interface Event {
  id: string
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

// Cached database fetch for events - revalidates every 60s
const getCachedEvents = unstable_cache(
  async () => {
    // Get approved events
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
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

// Fetch single event by ID - no caching for dynamic rendering
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const submission = await prisma.eventSubmission.findFirst({
      where: {
        id: id,
        status: 'APPROVED'
      },
      select: {
        id: true,
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
    console.error('Error fetching event by ID:', error)
    return null
  }
}
