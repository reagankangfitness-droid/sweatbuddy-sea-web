import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEventCancellationEmail, sendWaitlistSpotAvailableEmail } from '@/lib/event-confirmation-email'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the authenticated user's email
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 })
    }

    const { eventId, email } = await request.json()

    // Validate required fields
    if (!eventId || !email) {
      return NextResponse.json(
        { error: 'Event ID and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify the email in the request matches the authenticated user's email
    if (normalizedEmail !== userEmail) {
      return NextResponse.json(
        { error: 'You can only cancel your own RSVP' },
        { status: 403 }
      )
    }

    // Find the attendance record
    const attendance = await prisma.eventAttendance.findFirst({
      where: {
        eventId,
        email: normalizedEmail,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'No RSVP found for this email and event' },
        { status: 404 }
      )
    }

    // Delete the attendance record
    await prisma.eventAttendance.delete({
      where: { id: attendance.id },
    })

    // Also delete any chat messages from this user for this event
    await prisma.eventChatMessage.deleteMany({
      where: {
        eventId,
        senderEmail: normalizedEmail,
      },
    })

    // Send cancellation email (fire and forget)
    sendEventCancellationEmail({
      to: normalizedEmail,
      userName: attendance.name,
      eventName: attendance.eventName,
    }).catch((error) => {
      console.error('Failed to send cancellation email:', error)
    })

    // Check if event was full and reset isFull + notify next person on waitlist
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { id: true, eventName: true, isFull: true, maxTickets: true, slug: true },
    })

    if (event?.isFull) {
      // Recount attendees after deletion
      const currentCount = await prisma.eventAttendance.count({
        where: { eventId },
      })

      // Reset isFull if we're now below capacity
      if (!event.maxTickets || currentCount < event.maxTickets) {
        await prisma.eventSubmission.update({
          where: { id: eventId },
          data: { isFull: false },
        })
      }

      // Get next person on waitlist
      const nextInLine = await prisma.eventWaitlist.findFirst({
        where: {
          eventId,
          status: 'WAITING',
        },
        orderBy: { position: 'asc' },
      })

      if (nextInLine) {
        // Update their status to NOTIFIED
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour window

        await prisma.eventWaitlist.update({
          where: { id: nextInLine.id },
          data: {
            status: 'NOTIFIED',
            notifiedAt: new Date(),
            notificationExpires: expiresAt,
          },
        })

        // Send notification email
        const eventUrl = `https://www.sweatbuddies.co/e/${event.slug || event.id}`
        sendWaitlistSpotAvailableEmail({
          to: nextInLine.email,
          userName: nextInLine.name,
          eventName: event.eventName,
          eventUrl,
          expiresAt,
        }).catch((error) => {
          console.error('Failed to send waitlist notification:', error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RSVP cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    )
  }
}
