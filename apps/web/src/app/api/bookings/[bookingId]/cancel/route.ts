import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, calculateRefundAmount, toStripeAmount } from '@/lib/stripe'
import { processWaitlistForSpot } from '@/lib/waitlist'
import { cancelRemindersForBooking } from '@/lib/reminders'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookingId } = await params

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Try userActivity table first (Activity bookings)
    const booking = await prisma.userActivity.findUnique({
      where: { id: bookingId },
      include: { activity: true },
    })

    if (booking) {
      // --- Handle Activity booking cancellation (existing flow) ---
      if (booking.userId !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to cancel this booking' },
          { status: 403 }
        )
      }

      if (booking.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'This booking is already cancelled' },
          { status: 400 }
        )
      }

      if (booking.activity.startTime && new Date(booking.activity.startTime) < new Date()) {
        return NextResponse.json(
          { error: 'Cannot cancel a booking for a past activity' },
          { status: 400 }
        )
      }

      // Handle refund for paid bookings
      let refundResult = {
        status: 'not_applicable' as 'full' | 'partial' | 'none' | 'not_applicable',
        amount: 0,
        percentage: 0,
      }
      let refundError: string | null = null

      if (
        booking.paymentStatus === 'PAID' &&
        booking.stripePaymentIntentId &&
        booking.amountPaid &&
        booking.amountPaid > 0
      ) {
        const activityStartTime = booking.activity.startTime || new Date()
        const refundCalc = calculateRefundAmount(booking.amountPaid, activityStartTime)

        refundResult = {
          status: refundCalc.policy,
          amount: refundCalc.amount,
          percentage: refundCalc.percentage,
        }

        if (refundCalc.amount > 0) {
          try {
            const currency = booking.currency || 'SGD'
            await stripe.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
              amount: toStripeAmount(refundCalc.amount, currency),
              reason: 'requested_by_customer',
            })
          } catch (err) {
            console.error('Refund error:', err)
            refundError = err instanceof Error ? err.message : 'Stripe refund failed'
          }
        }
      }

      // Wrap DB updates in a transaction
      const updatedBooking = await prisma.$transaction(async (tx) => {
        // Update refund info if Stripe refund succeeded
        if (
          refundResult.amount > 0 &&
          !refundError &&
          booking.stripePaymentIntentId
        ) {
          await tx.userActivity.update({
            where: { id: bookingId },
            data: {
              refundAmount: refundResult.amount,
              refundedAt: new Date(),
              paymentStatus: 'REFUNDED',
            },
          })
        }

        // Mark booking as cancelled (CANCELLED, not REFUNDED, if refund failed)
        const updated = await tx.userActivity.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED', updatedAt: new Date() },
          include: {
            activity: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, imageUrl: true },
                },
              },
            },
          },
        })

        // Remove user from activity group chat
        const activityGroup = await tx.group.findFirst({
          where: { activityId: booking.activityId },
        })
        if (activityGroup) {
          await tx.userGroup.updateMany({
            where: { userId: clerkUserId, groupId: activityGroup.id },
            data: { deletedAt: new Date() },
          })
        }

        return updated
      })

      // Process waitlist
      try {
        await processWaitlistForSpot(booking.activityId, 1)
      } catch (waitlistError) {
        console.error('Error processing waitlist (non-blocking):', waitlistError)
      }

      // Cancel reminders
      try {
        await cancelRemindersForBooking(bookingId)
      } catch (reminderError) {
        console.error('Error cancelling reminders (non-blocking):', reminderError)
      }

      return NextResponse.json({
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking.id,
          userId: updatedBooking.userId,
          activityId: updatedBooking.activityId,
          status: updatedBooking.status,
          createdAt: updatedBooking.createdAt,
          updatedAt: updatedBooking.updatedAt,
          activity: {
            id: updatedBooking.activity.id,
            title: updatedBooking.activity.title,
            description: updatedBooking.activity.description,
            type: updatedBooking.activity.type,
            city: updatedBooking.activity.city,
            startTime: updatedBooking.activity.startTime,
            endTime: updatedBooking.activity.endTime,
            price: updatedBooking.activity.price,
            currency: updatedBooking.activity.currency,
            host: {
              id: updatedBooking.activity.user.id,
              name: updatedBooking.activity.user.name,
              email: updatedBooking.activity.user.email,
              imageUrl: updatedBooking.activity.user.imageUrl,
            },
          },
        },
        refund: refundResult.status !== 'not_applicable' ? {
          status: refundError ? 'failed' : refundResult.status,
          amount: refundResult.amount,
          percentage: refundResult.percentage,
          currency: booking.currency || 'SGD',
          ...(refundError ? { error: refundError } : {}),
        } : null,
      })
    }

    // --- Handle EventAttendance booking cancellation ---
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: bookingId },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify ownership by matching email
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress

    if (!userEmail || attendance.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this booking' },
        { status: 403 }
      )
    }

    // Check if already cancelled
    if (attendance.paymentStatus === 'refunded') {
      return NextResponse.json(
        { error: 'This booking is already cancelled' },
        { status: 400 }
      )
    }

    // Handle refund for paid EventAttendance bookings
    let refundResult = {
      status: 'not_applicable' as 'full' | 'partial' | 'none' | 'not_applicable',
      amount: 0,
      percentage: 0,
    }
    let eventRefundError: string | null = null

    if (
      attendance.paymentStatus === 'paid' &&
      attendance.stripePaymentId &&
      attendance.paymentAmount &&
      attendance.paymentAmount > 0
    ) {
      // Get event to check start time for refund calculation
      const event = await prisma.eventSubmission.findUnique({
        where: { id: attendance.eventId },
      })
      const eventStartTime = event?.eventDate || new Date()
      const amountInDollars = attendance.paymentAmount / 100
      const refundCalc = calculateRefundAmount(amountInDollars, eventStartTime)

      refundResult = {
        status: refundCalc.policy,
        amount: refundCalc.amount,
        percentage: refundCalc.percentage,
      }

      if (refundCalc.amount > 0) {
        try {
          await stripe.refunds.create({
            payment_intent: attendance.stripePaymentId,
            amount: toStripeAmount(refundCalc.amount, 'SGD'),
            reason: 'requested_by_customer',
          })
        } catch (err) {
          console.error('Refund error:', err)
          eventRefundError = err instanceof Error ? err.message : 'Stripe refund failed'
        }
      }
    }

    // Mark attendance as cancelled (use 'cancelled' if refund failed, 'refunded' if succeeded)
    await prisma.eventAttendance.update({
      where: { id: bookingId },
      data: { paymentStatus: eventRefundError ? 'cancelled' : 'refunded' },
    })

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: attendance.id,
        status: 'CANCELLED',
        activity: {
          title: attendance.eventName,
        },
      },
      refund: refundResult.status !== 'not_applicable' ? {
        status: eventRefundError ? 'failed' : refundResult.status,
        amount: refundResult.amount,
        percentage: refundResult.percentage,
        currency: 'SGD',
        ...(eventRefundError ? { error: eventRefundError } : {}),
      } : null,
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
