import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

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
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the attendance record
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: attendeeId },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    if (attendance.eventId !== eventId) {
      return NextResponse.json({ error: 'Attendee not in this event' }, { status: 400 })
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

    // Issue refund via Stripe
    // For Connect accounts, we need to refund from the platform
    const refund = await stripe.refunds.create({
      payment_intent: attendance.stripePaymentId,
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
