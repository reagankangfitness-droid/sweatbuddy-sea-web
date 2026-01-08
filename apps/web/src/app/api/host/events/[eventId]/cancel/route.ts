import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEventCancelledByHostEmail } from '@/lib/event-confirmation-email'
import { cancelRemindersForEvent } from '@/lib/event-reminders'

export const dynamic = 'force-dynamic'

interface CancelRequest {
  reason?: string
}

/**
 * POST /api/host/events/[eventId]/cancel
 * Cancel an event and notify all attendees
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const body: CancelRequest = await request.json().catch(() => ({}))
    const { reason } = body

    // Find the event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        day: true,
        time: true,
        location: true,
        organizerInstagram: true,
        status: true,
        price: true,
        isFree: true,
        stripeEnabled: true,
        paynowEnabled: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify host owns this event
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can't cancel already cancelled events
    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Event is already cancelled' }, { status: 400 })
    }

    // Get all attendees for this event
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        id: true,
        email: true,
        name: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentAmount: true,
      },
    })

    // Update event status to CANCELLED
    await prisma.eventSubmission.update({
      where: { id: eventId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: session.instagramHandle,
        cancellationReason: reason || null,
      },
    })

    // Cancel all pending reminders for this event
    await cancelRemindersForEvent(eventId)

    // Send cancellation emails to all attendees
    let emailsSent = 0
    let emailsFailed = 0

    for (const attendee of attendees) {
      try {
        // Determine refund status for paid attendees
        const wasPaid = attendee.paymentStatus === 'paid'
        let refundStatus: 'auto_refunded' | 'pending_manual' | null = null

        if (wasPaid) {
          // Stripe payments can be auto-refunded, PayNow needs manual
          refundStatus = attendee.paymentMethod === 'stripe' ? 'auto_refunded' : 'pending_manual'

          // TODO: For Stripe payments, trigger automatic refund here
          // For now, we'll mark as pending_manual and let host handle manually
          if (attendee.paymentMethod === 'stripe') {
            // Mark for manual refund - auto-refund requires more Stripe integration
            refundStatus = 'pending_manual'
          }
        }

        await sendEventCancelledByHostEmail({
          to: attendee.email,
          attendeeName: attendee.name,
          eventName: event.eventName,
          eventDay: event.day,
          eventTime: event.time,
          eventLocation: event.location,
          cancellationReason: reason,
          hostInstagram: event.organizerInstagram,
          wasPaid,
          paymentAmount: attendee.paymentAmount,
          paymentMethod: attendee.paymentMethod as 'stripe' | 'paynow' | null,
          refundStatus,
        })

        emailsSent++
      } catch (emailError) {
        console.error(`Failed to send cancellation email to ${attendee.email}:`, emailError)
        emailsFailed++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event cancelled successfully',
      attendeesNotified: emailsSent,
      emailsFailed,
    })
  } catch (error) {
    console.error('Event cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel event' },
      { status: 500 }
    )
  }
}
