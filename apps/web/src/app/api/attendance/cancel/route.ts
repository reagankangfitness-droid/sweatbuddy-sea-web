import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEventCancellationEmail } from '@/lib/event-confirmation-email'

export async function POST(request: Request) {
  try {
    const { eventId, email } = await request.json()

    // Validate required fields
    if (!eventId || !email) {
      return NextResponse.json(
        { error: 'Event ID and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

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
