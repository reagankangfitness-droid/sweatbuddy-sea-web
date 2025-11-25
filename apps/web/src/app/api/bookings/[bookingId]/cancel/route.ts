import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, calculateRefundAmount, toStripeAmount } from '@/lib/stripe'

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

    // Verify the booking exists and belongs to the user
    const booking = await prisma.userActivity.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        activity: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this booking' },
        { status: 403 }
      )
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This booking is already cancelled' },
        { status: 400 }
      )
    }

    // Check if activity has already happened (past activities)
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

    if (
      booking.paymentStatus === 'PAID' &&
      booking.stripePaymentIntentId &&
      booking.amountPaid &&
      booking.amountPaid > 0
    ) {
      // Calculate refund based on cancellation policy
      const activityStartTime = booking.activity.startTime || new Date()
      const refundCalc = calculateRefundAmount(booking.amountPaid, activityStartTime)

      refundResult = {
        status: refundCalc.policy,
        amount: refundCalc.amount,
        percentage: refundCalc.percentage,
      }

      // Process refund if applicable
      if (refundCalc.amount > 0) {
        try {
          const currency = booking.currency || 'SGD'
          await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId,
            amount: toStripeAmount(refundCalc.amount, currency),
            reason: 'requested_by_customer',
          })

          // Update booking with refund info
          await prisma.userActivity.update({
            where: { id: bookingId },
            data: {
              refundAmount: refundCalc.amount,
              refundedAt: new Date(),
              paymentStatus: 'REFUNDED',
            },
          })
        } catch (refundError) {
          console.error('Refund error:', refundError)
          // Continue with cancellation even if refund fails
          // The refund can be processed manually later
        }
      }
    }

    // Update booking status to CANCELLED
    const updatedBooking = await prisma.userActivity.update({
      where: {
        id: bookingId,
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
      include: {
        activity: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    // Remove user from activity group chat
    const activityGroup = await prisma.group.findFirst({
      where: { activityId: booking.activityId },
    })

    if (activityGroup) {
      await prisma.userGroup.updateMany({
        where: {
          userId: clerkUserId,
          groupId: activityGroup.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
    }

    // Format the response
    const formattedBooking = {
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
    }

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: formattedBooking,
      refund: refundResult.status !== 'not_applicable' ? {
        status: refundResult.status,
        amount: refundResult.amount,
        percentage: refundResult.percentage,
        currency: booking.currency || 'SGD',
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
