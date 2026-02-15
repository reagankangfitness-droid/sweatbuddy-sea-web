import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendEventCancelledByHostEmail, sendRefundNotificationEmail } from '@/lib/event-confirmation-email'
import { cancelRemindersForEvent } from '@/lib/event-reminders'

export const dynamic = 'force-dynamic'

interface CancelRequest {
  reason?: string
}

/**
 * POST /api/host/events/[eventId]/cancel
 * Cancel an event, auto-refund Stripe payments, and notify all attendees
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
        currency: true,
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
        stripePaymentId: true,
      },
    })

    // Use transaction to ensure atomicity of cancellation operations
    await prisma.$transaction(async (tx) => {
      // Update event status to CANCELLED
      await tx.eventSubmission.update({
        where: { id: eventId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: session.instagramHandle,
          cancellationReason: reason || null,
        },
      })

      // Delete all pending reminders for this event within transaction
      await tx.eventReminder.deleteMany({
        where: {
          eventId,
          status: 'PENDING',
        },
      })
    })

    // Cancel any additional reminders (this is idempotent, safe outside transaction)
    await cancelRemindersForEvent(eventId).catch(err => {
      console.error('Error cancelling additional reminders:', err)
    })

    // Process refunds and send cancellation emails
    let emailsSent = 0
    let emailsFailed = 0
    let refundsProcessed = 0
    let refundsFailed = 0
    let totalRefundedAmount = 0

    for (const attendee of attendees) {
      try {
        const wasPaid = attendee.paymentStatus === 'paid'
        let refundStatus: 'auto_refunded' | 'pending_manual' | null = null

        if (wasPaid) {
          if (attendee.paymentMethod === 'stripe' && attendee.stripePaymentId) {
            // Auto-refund Stripe payments
            try {
              await stripe.refunds.create({
                payment_intent: attendee.stripePaymentId,
              })

              // Update attendance record
              await prisma.eventAttendance.update({
                where: { id: attendee.id },
                data: { paymentStatus: 'refunded' },
              })

              // Update transaction record
              await prisma.eventTransaction.updateMany({
                where: { attendanceId: attendee.id },
                data: {
                  status: 'REFUNDED',
                  refundAmount: attendee.paymentAmount,
                  refundedAt: new Date(),
                  refundReason: `Event cancelled by host${reason ? ': ' + reason : ''}`,
                },
              })

              refundStatus = 'auto_refunded'
              refundsProcessed++
              totalRefundedAmount += attendee.paymentAmount || 0

              // Send refund notification email
              sendRefundNotificationEmail({
                to: attendee.email,
                userName: attendee.name,
                eventName: event.eventName,
                refundAmount: attendee.paymentAmount || 0,
                currency: event.currency || 'SGD',
                refundType: 'full',
                reason: `Event cancelled by host${reason ? ': ' + reason : ''}`,
              }).catch(err => {
                console.error(`Failed to send refund email to ${attendee.email}:`, err)
              })
            } catch (refundError) {
              console.error(`Failed to refund Stripe payment for ${attendee.email}:`, refundError)
              refundStatus = 'pending_manual'
              refundsFailed++
            }
          } else {
            // PayNow or other - needs manual refund
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
      refunds: {
        processed: refundsProcessed,
        failed: refundsFailed,
        totalAmount: totalRefundedAmount,
      },
    })
  } catch (error) {
    console.error('Event cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel event' },
      { status: 500 }
    )
  }
}
