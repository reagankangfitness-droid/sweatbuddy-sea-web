import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

// Revalidate every 60 seconds - allows Vercel edge caching
export const revalidate = 60

interface AttendeePreview {
  id: string
  name: string
  imageUrl: string | null
}

interface Event {
  id: string
  slug: string | null
  name: string
  category: string
  day: string
  eventDate: string | null
  time: string
  location: string
  description: string | null
  organizer: string
  imageUrl: string | null
  communityLink: string | null
  recurring: boolean
  isFull: boolean
  goingCount: number
  attendeesPreview: AttendeePreview[]
  // Pricing
  isFree: boolean
  price: number | null  // in cents
}

// Cached database query - revalidates every 60s
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
        // Pricing
        isFree: true,
        price: true,
      },
    })

    // Get attendance counts and previews for all events
    const eventIds = approvedSubmissions.map(s => s.id)

    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      _count: { id: true },
    })

    const countMap = new Map(
      attendanceCounts.map(item => [item.eventId, item._count.id])
    )

    // Get first 5 attendees for each event
    const attendeePreviews = await prisma.eventAttendance.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        eventId: true,
        name: true,
      },
    })

    // Group attendees by event
    const attendeesByEvent = new Map<string, typeof attendeePreviews>()
    for (const a of attendeePreviews) {
      const list = attendeesByEvent.get(a.eventId) || []
      if (list.length < 5) {
        list.push(a)
        attendeesByEvent.set(a.eventId, list)
      }
    }

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
      attendeesPreview: (attendeesByEvent.get(submission.id) || []).map(a => {
        const name = a.name?.trim() || 'Anonymous'
        const parts = name.split(' ').filter(Boolean)
        const displayName = parts.length >= 2
          ? `${parts[0]} ${parts[1][0]}.`
          : parts[0] || 'Anonymous'
        return {
          id: a.id,
          name: displayName,
          imageUrl: null, // Will be fetched by the detail view
        }
      }),
      // Pricing
      isFree: submission.isFree,
      price: submission.price,
    }))
  },
  ['events-list'],
  { revalidate: 60, tags: ['events'] }
)

export async function GET() {
  try {
    const events: Event[] = await getCachedEvents()

    return NextResponse.json(
      { events },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}
