import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Verify host owns this event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
        eventName: true,
        isFree: true,
        price: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all events by this host to count repeat attendees
    const hostEvents = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        status: 'APPROVED',
      },
      select: { id: true },
    })
    const hostEventIds = hostEvents.map(e => e.id)

    // Fetch attendees with payment info
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        id: true,
        email: true,
        name: true,
        timestamp: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentAmount: true,
        paymentReference: true,
        paidAt: true,
        verifiedBy: true,
        verifiedAt: true,
      },
      orderBy: [
        { paymentStatus: 'asc' }, // pending first
        { timestamp: 'desc' },
      ],
    })

    // Get repeat attendance counts for all attendee emails across host's events
    const attendeeEmails = attendees.map(a => a.email.toLowerCase())
    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['email'],
      where: {
        eventId: { in: hostEventIds },
        email: { in: attendeeEmails, mode: 'insensitive' },
      },
      _count: { id: true },
    })

    // Create lookup map for attendance counts
    const countMap = new Map(
      attendanceCounts.map(item => [item.email.toLowerCase(), item._count.id])
    )

    // Add attendance count to each attendee
    const attendeesWithHistory = attendees.map(attendee => ({
      ...attendee,
      totalAttendance: countMap.get(attendee.email.toLowerCase()) || 1,
    }))

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.eventName,
        isFree: event.isFree,
        price: event.price,
      },
      attendees: attendeesWithHistory,
    })
  } catch (error) {
    console.error('Fetch attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}
