import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      )
    }

    // Find the booking by checkout session ID
    const booking = await prisma.userActivity.findFirst({
      where: {
        stripeCheckoutSessionId: sessionId,
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
            host: {
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

    if (!booking) {
      // The webhook might not have processed yet, so let's check if the booking exists by user + activity
      const metadata = session.metadata || {}
      const activityId = metadata.activity_id
      const userId = metadata.user_id

      if (activityId && userId) {
        const pendingBooking = await prisma.userActivity.findUnique({
          where: {
            userId_activityId: {
              userId: userId,
              activityId: activityId,
            },
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

        if (pendingBooking) {
          return NextResponse.json({
            booking: {
              id: pendingBooking.id,
              status: pendingBooking.status,
              paymentStatus: pendingBooking.paymentStatus,
              amountPaid: pendingBooking.amountPaid,
              currency: pendingBooking.currency,
              paidAt: pendingBooking.paidAt,
              activity: pendingBooking.activity,
            },
            message: 'Booking is being processed',
          })
        }
      }

      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amountPaid: booking.amountPaid,
        currency: booking.currency,
        paidAt: booking.paidAt,
        activity: {
          ...booking.activity,
          user: booking.activity.host || booking.activity.user,
        },
      },
    })
  } catch (error) {
    console.error('Verify booking error:', error)
    return NextResponse.json(
      { error: 'Failed to verify booking' },
      { status: 500 }
    )
  }
}
