import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendRefundNotificationEmail } from '@/lib/event-confirmation-email'
import { calculateRefund } from '@/lib/refund-policy'

export const dynamic = 'force-dynamic'

/**
 * POST /api/host/events/[eventId]/refund-all
 * Bulk refund all eligible paid attendees for an event
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

    // Find the event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        organizerInstagram: true,
        refundPolicy: true,
        eventDate: true,
        price: true,
        currency: true,
        status: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify host owns this event
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find all paid attendees
    const paidAttendees = await prisma.eventAttendance.findMany({
      where: {
        eventId,
        paymentStatus: 'paid',
      },
      select: {
        id: true,
        email: true,
        name: true,
        paymentAmount: true,
        paymentMethod: true,
        stripePaymentId: true,
      },
    })

    if (paidAttendees.length === 0) {
      return NextResponse.json({
        success: true,
        refunded: 0,
        failed: 0,
        skipped: 0,
        totalAmount: 0,
        message: 'No paid attendees to refund',
      })
    }

    let refunded = 0
    let failed = 0
    let skipped = 0
    let totalAmount = 0

    // Process in batches of 5 to avoid Stripe rate limits
    const batchSize = 5
    for (let i = 0; i < paidAttendees.length; i += batchSize) {
      const batch = paidAttendees.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async (attendee) => {
          // Only refund Stripe payments with a payment ID
          if (attendee.paymentMethod !== 'stripe' || !attendee.stripePaymentId) {
            skipped++
            return { status: 'skipped' as const, attendee }
          }

          const refundCalc = calculateRefund(
            { refundPolicy: event.refundPolicy, eventDate: event.eventDate, price: event.price },
            attendee.paymentAmount || 0,
            new Date(),
            true // host-initiated = always full refund
          )

          if (!refundCalc.eligible) {
            skipped++
            return { status: 'skipped' as const, attendee }
          }

          // Process Stripe refund
          await stripe.refunds.create({
            payment_intent: attendee.stripePaymentId,
            amount: refundCalc.amount > 0 && refundCalc.percent < 100
              ? refundCalc.amount
              : undefined, // undefined = full refund
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
              refundAmount: refundCalc.amount,
              refundedAt: new Date(),
              refundReason: 'Bulk refund by host',
            },
          })

          // Send refund email (fire and forget)
          sendRefundNotificationEmail({
            to: attendee.email,
            userName: attendee.name,
            eventName: event.eventName,
            refundAmount: refundCalc.amount,
            currency: event.currency || 'SGD',
            refundType: refundCalc.percent === 100 ? 'full' : 'partial',
            reason: 'Bulk refund by host',
          }).catch(err => {
            console.error(`Failed to send refund email to ${attendee.email}:`, err)
          })

          totalAmount += refundCalc.amount
          refunded++
          return { status: 'refunded' as const, attendee }
        })
      )

      // Count failures from Promise.allSettled
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('Batch refund error:', result.reason)
          failed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      refunded,
      failed,
      skipped,
      totalAmount,
    })
  } catch (error) {
    console.error('Bulk refund error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk refund' },
      { status: 500 }
    )
  }
}
