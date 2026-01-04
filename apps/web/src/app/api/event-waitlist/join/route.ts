import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { eventId, email, name } = await request.json()

    if (!eventId || !email) {
      return NextResponse.json(
        { error: 'Event ID and email are required' },
        { status: 400 }
      )
    }

    // Check if event exists and is full
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        isFull: true,
        maxTickets: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If event isn't full, they should just RSVP normally
    if (!event.isFull) {
      return NextResponse.json(
        { error: 'Event is not full. Please RSVP instead.' },
        { status: 400 }
      )
    }

    // Check if already on waitlist
    const existingEntry = await prisma.eventWaitlist.findUnique({
      where: {
        eventId_email: { eventId, email: email.toLowerCase() },
      },
    })

    if (existingEntry) {
      return NextResponse.json({
        success: true,
        position: existingEntry.position,
        message: 'You are already on the waitlist',
      })
    }

    // Check if already registered for the event
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: {
        email_eventId: { email: email.toLowerCase(), eventId },
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // Get current waitlist position
    const lastPosition = await prisma.eventWaitlist.findFirst({
      where: { eventId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const nextPosition = (lastPosition?.position || 0) + 1

    // Add to waitlist
    const waitlistEntry = await prisma.eventWaitlist.create({
      data: {
        eventId,
        email: email.toLowerCase(),
        name: name || null,
        position: nextPosition,
        status: 'WAITING',
      },
    })

    return NextResponse.json({
      success: true,
      position: waitlistEntry.position,
      message: `You're #${waitlistEntry.position} on the waitlist!`,
    })
  } catch (error) {
    console.error('Join waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}

// Get waitlist status for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  const email = searchParams.get('email')

  if (!eventId || !email) {
    return NextResponse.json(
      { error: 'Event ID and email are required' },
      { status: 400 }
    )
  }

  try {
    const entry = await prisma.eventWaitlist.findUnique({
      where: {
        eventId_email: { eventId, email: email.toLowerCase() },
      },
      select: {
        position: true,
        status: true,
        notifiedAt: true,
        notificationExpires: true,
      },
    })

    if (!entry) {
      return NextResponse.json({ onWaitlist: false })
    }

    return NextResponse.json({
      onWaitlist: true,
      position: entry.position,
      status: entry.status,
      notifiedAt: entry.notifiedAt,
      notificationExpires: entry.notificationExpires,
    })
  } catch (error) {
    console.error('Get waitlist status error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist status' },
      { status: 500 }
    )
  }
}
