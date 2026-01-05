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
    const otherEventIds = hostEventIds.filter(id => id !== eventId)

    // Fetch attendees with payment info and attendance tracking
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
        actuallyAttended: true,
        markedAttendedAt: true,
        markedAttendedBy: true,
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

    // Get prior attendance (excluding current event) to identify true first-timers
    const priorAttendance = otherEventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['email'],
          where: {
            eventId: { in: otherEventIds },
            email: { in: attendeeEmails, mode: 'insensitive' },
          },
          _count: { id: true },
        })
      : []

    // Create lookup maps
    const countMap = new Map(
      attendanceCounts.map(item => [item.email.toLowerCase(), item._count.id])
    )
    const priorCountMap = new Map(
      priorAttendance.map(item => [item.email.toLowerCase(), item._count.id])
    )

    // Add attendance count and first-timer flag to each attendee
    const attendeesWithHistory = attendees.map(attendee => {
      const emailLower = attendee.email.toLowerCase()
      const totalAttendance = countMap.get(emailLower) || 1
      const priorCount = priorCountMap.get(emailLower) || 0
      const isFirstTimer = priorCount === 0 // No prior attendance with this host

      return {
        ...attendee,
        totalAttendance,
        isFirstTimer,
      }
    })

    // Separate first-timers from returning attendees
    const firstTimers = attendeesWithHistory.filter(a => a.isFirstTimer)
    const returning = attendeesWithHistory.filter(a => !a.isFirstTimer)

    // Calculate attendance stats
    const totalRSVPs = attendees.length
    const markedAttended = attendees.filter(a => a.actuallyAttended === true).length
    const markedNoShow = attendees.filter(a => a.actuallyAttended === false).length
    const unmarked = attendees.filter(a => a.actuallyAttended === null).length
    const showUpRate = markedAttended + markedNoShow > 0
      ? Math.round((markedAttended / (markedAttended + markedNoShow)) * 100)
      : null

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.eventName,
        isFree: event.isFree,
        price: event.price,
      },
      attendees: attendeesWithHistory,
      firstTimers,
      returning,
      stats: {
        totalRSVPs,
        firstTimerCount: firstTimers.length,
        returningCount: returning.length,
        markedAttended,
        markedNoShow,
        unmarked,
        showUpRate,
      },
    })
  } catch (error) {
    console.error('Fetch attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}
