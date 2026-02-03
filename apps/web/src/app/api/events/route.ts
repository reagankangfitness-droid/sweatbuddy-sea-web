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
  paynowEnabled: boolean
  paynowQrCode: string | null
  paynowNumber: string | null
}

// Helper to check if an event should be shown
// - Recurring events: ALWAYS show (they repeat weekly)
// - One-time events: Show events from yesterday onwards (timezone-safe)
// - Frontend handles precise timezone filtering (Today, Tomorrow, etc.)
function isUpcomingEvent(eventDate: Date | null, recurring: boolean): boolean {
  // RECURRING EVENTS: Always show - they happen every week on their designated day
  if (recurring) return true

  // Events without a date - show them (legacy data)
  if (!eventDate) return true

  // Use UTC and subtract 1 day to be timezone-safe for all regions
  // This ensures events aren't filtered out due to timezone differences
  // Frontend will do precise filtering based on user's local timezone
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  yesterday.setUTCHours(0, 0, 0, 0)

  const eventDay = new Date(eventDate)
  eventDay.setUTCHours(0, 0, 0, 0)

  // Show events from yesterday onwards (covers all timezones)
  return eventDay >= yesterday
}

// Cached database query - revalidates every 60s
const getCachedEvents = unstable_cache(
  async () => {
    // Get yesterday's date at midnight UTC (timezone-safe for all regions)
    // This ensures we don't accidentally filter out events due to timezone differences
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    yesterday.setUTCHours(0, 0, 0, 0)

    // Get approved events that are upcoming or recurring
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          // Events from yesterday onwards (timezone-safe)
          { eventDate: { gte: yesterday } },
          // Recurring events (always show)
          { recurring: true },
          // Events without dates (legacy, show them)
          { eventDate: null }
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
        // Pricing
        isFree: true,
        price: true,
        paynowEnabled: true,
        paynowQrCode: true,
        paynowNumber: true,
      },
    })

    // Filter out past recurring events (recurring events with past specific dates)
    const upcomingSubmissions = approvedSubmissions.filter(submission =>
      isUpcomingEvent(submission.eventDate, submission.recurring)
    )

    // Get attendance counts and previews for all events
    const eventIds = upcomingSubmissions.map(s => s.id)

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

    return upcomingSubmissions.map(submission => ({
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
      paynowEnabled: submission.paynowEnabled,
      paynowQrCode: submission.paynowQrCode,
      paynowNumber: submission.paynowNumber,
    }))
  },
  ['events-list-v5'], // Updated cache key - timezone-agnostic, frontend handles timezone filtering
  { revalidate: 60, tags: ['events'] }
)

export async function GET() {
  try {
    const events: Event[] = await getCachedEvents()

    return NextResponse.json(
      { events },
      {
        headers: {
          // Reduced cache times to ensure fresh data after approval
          // ISR + revalidateTag handles the real caching
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          'CDN-Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch {
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}
