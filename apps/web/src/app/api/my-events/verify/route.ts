import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import eventsData from '@/data/events.json'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Find and validate token
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
    })

    if (!magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 401 }
      )
    }

    if (magicLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired. Please request a new one.' },
        { status: 401 }
      )
    }

    // Mark token as used (but don't invalidate - allow multiple views within 24h)
    if (!magicLink.usedAt) {
      await prisma.magicLinkToken.update({
        where: { token },
        data: { usedAt: new Date() },
      })
    }

    // Get all RSVPs for this email
    const attendances = await prisma.eventAttendance.findMany({
      where: { email: magicLink.email },
      orderBy: { timestamp: 'desc' },
    })

    // Get event details from static data and approved submissions
    const staticEvents = eventsData.events
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
    })

    // Enrich attendance records with event details
    const enrichedEvents = attendances.map((attendance) => {
      // Check static events first
      const staticEvent = staticEvents.find((e) => e.id === attendance.eventId)
      if (staticEvent) {
        return {
          id: attendance.id,
          eventId: attendance.eventId,
          eventName: attendance.eventName,
          rsvpDate: attendance.timestamp,
          event: {
            id: staticEvent.id,
            name: staticEvent.name,
            category: staticEvent.category,
            day: staticEvent.day,
            time: staticEvent.time,
            location: staticEvent.location,
            organizer: staticEvent.organizer,
            imageUrl: staticEvent.imageUrl || null,
            recurring: staticEvent.recurring,
          },
        }
      }

      // Check approved submissions
      const submissionId = attendance.eventId.replace('submission-', '')
      const submission = approvedSubmissions.find((s) => s.id === submissionId)
      if (submission) {
        return {
          id: attendance.id,
          eventId: attendance.eventId,
          eventName: attendance.eventName,
          rsvpDate: attendance.timestamp,
          event: {
            id: `submission-${submission.id}`,
            name: submission.eventName,
            category: submission.category,
            day: submission.day,
            time: submission.time,
            location: submission.location,
            organizer: submission.organizerInstagram,
            imageUrl: submission.imageUrl || null,
            recurring: submission.recurring,
          },
        }
      }

      // Event not found (might have been removed)
      return {
        id: attendance.id,
        eventId: attendance.eventId,
        eventName: attendance.eventName,
        rsvpDate: attendance.timestamp,
        event: null,
      }
    })

    return NextResponse.json({
      success: true,
      email: magicLink.email,
      events: enrichedEvents,
    })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { error: 'Failed to verify link' },
      { status: 500 }
    )
  }
}
