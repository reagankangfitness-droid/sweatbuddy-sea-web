import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentVerifiedEmail, sendPaymentRejectedEmail } from '@/lib/event-confirmation-email'
import { scheduleEventReminder } from '@/lib/event-reminders'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId } = await params
    const { action } = await request.json()

    if (!['confirm', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the attendance record
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: paymentId },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Find the event to verify ownership and get details for email
    const event = await prisma.eventSubmission.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        slug: true,
        eventName: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        price: true,
        organizerInstagram: true,
        communityLink: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify host owns this event
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow verification of pending payments
    if (attendance.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not pending verification' },
        { status: 400 }
      )
    }

    // Update payment status
    const updatedAttendance = await prisma.eventAttendance.update({
      where: { id: paymentId },
      data: {
        paymentStatus: action === 'confirm' ? 'paid' : 'failed',
        verifiedBy: session.instagramHandle,
        verifiedAt: new Date(),
        paidAt: action === 'confirm' ? new Date() : null,
      },
    })

    // Send email to attendee about confirmation/rejection
    if (attendance.email) {
      try {
        if (action === 'confirm') {
          await sendPaymentVerifiedEmail({
            to: attendance.email,
            attendeeName: attendance.name,
            eventName: event.eventName,
            eventDay: event.day,
            eventTime: event.time,
            eventLocation: event.location,
            amountPaid: event.price || 0,
            organizerInstagram: event.organizerInstagram,
            communityLink: event.communityLink,
            eventSlug: event.slug,
            eventId: event.id,
          })

          // Schedule 24-hour reminder for confirmed payment
          if (event.eventDate) {
            scheduleEventReminder({
              attendanceId: paymentId,
              eventId: event.id,
              eventDate: event.eventDate,
            }).catch((err) => {
              console.error('Failed to schedule reminder:', err)
            })
          }
        } else {
          await sendPaymentRejectedEmail({
            to: attendance.email,
            attendeeName: attendance.name,
            eventName: event.eventName,
            eventId: event.id,
            eventSlug: event.slug,
            amountAttempted: event.price || 0,
          })
        }
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send payment verification email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: updatedAttendance.paymentStatus,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
