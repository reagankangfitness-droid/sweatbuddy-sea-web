import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calculateRefund } from '@/lib/refund-policy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; attendeeId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, attendeeId } = await params

    // Verify the event belongs to this host
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
        eventName: true,
        refundPolicy: true,
        eventDate: true,
        price: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.organizerInstagram || !session.instagramHandle ||
        event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the attendance record — scoped to this event to prevent cross-event access
    const attendance = await prisma.eventAttendance.findFirst({
      where: { id: attendeeId, eventId },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    if (attendance.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'No paid payment to refund' }, { status: 400 })
    }

    if (!attendance.stripePaymentId) {
      return NextResponse.json({ error: 'No Stripe payment ID found' }, { status: 400 })
    }

    // Get the transaction record
    const transaction = await prisma.eventTransaction.findFirst({
      where: {
        attendanceId: attendeeId,
        status: 'SUCCEEDED',
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check refund policy — host-initiated refunds always get full refund
    const refundCalc = calculateRefund(
      { refundPolicy: event.refundPolicy, eventDate: event.eventDate, price: event.price },
      attendance.paymentAmount || transaction.totalCharged || 0,
      new Date(),
      true // host-initiated
    )

    if (!refundCalc.eligible) {
      return NextResponse.json(
        { error: refundCalc.reason },
        { status: 400 }
      )
    }

    // Issue refund via Stripe
    // For Connect accounts, we need to refund from the platform
    const refund = await stripe.refunds.create({
      payment_intent: attendance.stripePaymentId,
      amount: refundCalc.percent < 100 ? refundCalc.amount : undefined,
      reason: 'requested_by_customer',
    })

    // Update attendance record
    await prisma.eventAttendance.update({
      where: { id: attendeeId },
      data: {
        paymentStatus: 'refunded',
      },
    })

    // Update transaction record
    await prisma.eventTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refund.amount,
        refundReason: refundCalc.reason,
      },
    })

    // Decrement ticketsSold
    await prisma.eventSubmission.update({
      where: { id: eventId },
      data: {
        ticketsSold: {
          decrement: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      policy: refundCalc.reason,
    })
  } catch (error) {
    console.error('[Refund] Error:', error)

    // Handle Stripe-specific errors
    if (error instanceof Error && 'type' in error) {
      const stripeError = error as { type: string; message: string }
      return NextResponse.json(
        { error: stripeError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
