import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import eventsData from '@/data/events.json'

// Get organizer's events
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const instagramHandle = session.instagramHandle

    // Find events where organizer matches (from static data and submissions)
    const staticEvents = eventsData.events.filter(
      (e) => e.organizer.toLowerCase() === instagramHandle.toLowerCase()
    )

    // Find all submissions by this organizer (pending, approved, rejected)
    const submissions = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          equals: instagramHandle,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get attendance counts for all events
    const eventIds = [
      ...staticEvents.map((e) => e.id),
      ...submissions.map((s) => s.id),
    ]

    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    })

    const countMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Format response
    const events = [
      ...staticEvents.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        day: e.day,
        time: e.time,
        location: e.location,
        description: e.description || null,
        imageUrl: e.imageUrl || null,
        recurring: e.recurring,
        attendeeCount: countMap.get(e.id) || 0,
        source: 'static' as const,
        status: 'approved' as const, // Static events are always live
      })),
      ...submissions.map((s) => ({
        id: s.id,
        name: s.eventName,
        category: s.category,
        day: s.day,
        eventDate: s.eventDate?.toISOString() || null,
        time: s.time,
        location: s.location,
        description: s.description || null,
        imageUrl: s.imageUrl || null,
        recurring: s.recurring,
        attendeeCount: countMap.get(s.id) || 0,
        source: 'submission' as const,
        status: s.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        rejectionReason: s.rejectionReason || null,
        createdAt: s.createdAt.toISOString(),
      })),
    ]

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Get organizer events error:', error)
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    )
  }
}
