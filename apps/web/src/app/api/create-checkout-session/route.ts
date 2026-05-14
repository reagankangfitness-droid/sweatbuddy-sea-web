import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { calculateFees } from '@/lib/constants/fees'
import { sendActivityBookingConfirmationEmail } from '@/lib/event-confirmation-email'
import { getCurrentDbUser } from '@/lib/current-user'

export async function POST(request: NextRequest) {
  let reservedBookingId: string | null = null
  let checkoutSessionIdForCleanup: string | null = null

  try {
    const dbUser = await getCurrentDbUser()

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Please sign in to book activities' },
        { status: 401 }
      )
    }

    // 2. Get request body
    const body = await request.json()
    const { activityId, inviteCode } = body

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // 4. Get activity details with host info
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        userActivities: {
          where: {
            status: 'JOINED',
            deletedAt: null,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // 5. Validate activity is bookable
    if (activity.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This activity is not available for booking' },
        { status: 400 }
      )
    }

    // Check if activity is in the future
    if (activity.startTime && new Date(activity.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book past activities' },
        { status: 400 }
      )
    }

    // Check available spots
    const joinedCount = activity.userActivities.length
    if (activity.maxPeople && joinedCount >= activity.maxPeople) {
      return NextResponse.json(
        { error: 'This activity is fully booked' },
        { status: 400 }
      )
    }

    // 6. Check if user is the host
    const hostId = activity.hostId || activity.userId
    if (dbUser.id === hostId) {
      return NextResponse.json(
        { error: 'You cannot book your own activity' },
        { status: 400 }
      )
    }

    // 7. Check if user already has a booking
    const existingBooking = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId: dbUser.id,
          activityId: activityId,
        },
      },
    })

    if (existingBooking && existingBooking.status === 'JOINED') {
      return NextResponse.json(
        { error: 'You have already booked this activity' },
        { status: 400 }
      )
    }

    // 8. Calculate price (apply referral discount if applicable)
    let finalPrice = activity.price
    let discountAmount = 0
    let referralInvite = null

    if (inviteCode) {
      referralInvite = await prisma.referralInvite.findFirst({
        where: {
          inviteCode: inviteCode,
          activityId: activityId,
          status: { in: ['PENDING', 'CLICKED'] },
          expiresAt: { gt: new Date() },
        },
      })

      if (referralInvite) {
        // Apply 50% discount
        discountAmount = finalPrice * 0.5
        finalPrice = finalPrice - discountAmount
      }
    }

    const currency = activity.currency || STRIPE_CONFIG.DEFAULT_CURRENCY
    const hostInfo = activity.host || activity.user

    // 9. Handle FREE activities (price is 0 or became 0 after discount)
    if (finalPrice === 0 || activity.price === 0) {
      const booking = await prisma.$transaction(async (tx) => {
        const joinedCount = await tx.userActivity.count({
          where: {
            activityId,
            deletedAt: null,
            status: 'JOINED',
          },
        })
        if (activity.maxPeople && joinedCount >= activity.maxPeople) {
          throw new Error('ACTIVITY_FULL')
        }

        const booking = await tx.userActivity.upsert({
          where: {
            userId_activityId: {
              userId: dbUser.id,
              activityId: activityId,
            },
          },
          update: {
            status: 'JOINED',
            paymentStatus: 'FREE',
            amountPaid: 0,
            currency: currency,
            paidAt: new Date(),
            deletedAt: null,
          },
          create: {
            userId: dbUser.id,
            activityId: activityId,
            status: 'JOINED',
            paymentStatus: 'FREE',
            amountPaid: 0,
            currency: currency,
            paidAt: new Date(),
          },
        })

        const activityGroup = await tx.group.findFirst({
          where: { activityId: activityId },
        })

        if (activityGroup) {
          await tx.userGroup.upsert({
            where: {
              userId_groupId: {
                userId: dbUser.id,
                groupId: activityGroup.id,
              },
            },
            update: {
              deletedAt: null,
            },
            create: {
              userId: dbUser.id,
              groupId: activityGroup.id,
              role: 'MEMBER',
            },
          })
        }

        await tx.eventChat.upsert({
          where: { activityId: activityId },
          update: {},
          create: { activityId: activityId, isActive: true },
        })

        return booking
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

      // Handle referral conversion for free activities
      if (referralInvite) {
        await prisma.referralInvite.update({
          where: { id: referralInvite.id },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            friendDiscountApplied: true,
          },
        })

        await prisma.referralConversion.create({
          data: {
            inviteId: referralInvite.id,
            friendUserId: dbUser.id,
            userActivityId: booking.id,
            discountType: 'FREE',
            discountValue: 100,
            discountAmount: activity.price,
          },
        })
      }

      // Send booking confirmation email (async, don't block response)
      const userRecord = await prisma.user.findUnique({
        where: { id: dbUser.id },
        select: { email: true, name: true },
      })

      if (userRecord?.email) {
        sendActivityBookingConfirmationEmail({
          to: userRecord.email,
          attendeeName: userRecord.name || 'there',
          activityId,
          activityTitle: activity.title,
          startTime: activity.startTime ? new Date(activity.startTime) : null,
          endTime: activity.endTime ? new Date(activity.endTime) : null,
          location: activity.address || activity.city,
          hostName: hostInfo?.name || undefined,
          currency,
          amountPaidCents: 0,
        }).catch((err) => console.error('Failed to send booking confirmation email:', err))
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
        },
        message: 'Booking confirmed!',
        isFree: true,
        redirectUrl: `/booking/success?booking_id=${booking.id}&free=true`,
      })
    }

    // 10. Create Stripe Checkout Session for PAID activities
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Format activity date for description
    const activityDate = activity.startTime
      ? new Date(activity.startTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Date TBD'

    // Calculate fees using new fee structure (3.7% + $1.79 per ticket)
    // calculateFees expects dollars; activity.price is now stored in cents
    const fees = calculateFees(finalPrice / 100, 1)

    const reservedBooking = await prisma.$transaction(async (tx) => {
      const reservedCount = await tx.userActivity.count({
        where: {
          activityId,
          deletedAt: null,
          OR: [
            { status: 'JOINED' },
            { status: 'INTERESTED', paymentStatus: 'PENDING' },
          ],
        },
      })
      if (activity.maxPeople && reservedCount >= activity.maxPeople) {
        throw new Error('ACTIVITY_FULL')
      }

      return tx.userActivity.upsert({
        where: {
          userId_activityId: {
            userId: dbUser.id,
            activityId: activityId,
          },
        },
        update: {
          status: 'INTERESTED', // Will be updated to JOINED after payment
          paymentStatus: 'PENDING',
          stripeCheckoutSessionId: null,
          amountPaid: Math.round(fees.attendeePays * 100), // Total amount attendee pays (cents)
          currency: currency,
          deletedAt: null,
        },
        create: {
          userId: dbUser.id,
          activityId: activityId,
          status: 'INTERESTED',
          paymentStatus: 'PENDING',
          amountPaid: Math.round(fees.attendeePays * 100), // Total amount attendee pays (cents)
          currency: currency,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    reservedBookingId = reservedBooking.id

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      // Customer info
      customer_email: dbUser.email,

      // Line items - ticket price + service fee
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: activity.title,
              description: `${activityDate} - ${activity.city}${hostInfo?.name ? ` - Hosted by ${hostInfo.name}` : ''}`,
              images: activity.imageUrl ? [activity.imageUrl] : [],
            },
            unit_amount: finalPrice, // already in cents
          },
          quantity: 1,
        },
        // Service fee as separate line item for transparency
        ...(fees.serviceFee > 0
          ? [
              {
                price_data: {
                  currency: currency.toLowerCase(),
                  product_data: {
                    name: 'Service Fee',
                    description: 'Platform and payment processing fee',
                  },
                  unit_amount: Math.round(fees.serviceFee * 100), // convert dollars to cents
                },
                quantity: 1,
              },
            ]
          : []),
      ],

      // Metadata for webhook processing
      metadata: {
        activity_id: activityId,
        user_id: dbUser.id,
        host_id: hostId,
        original_price: activity.price.toString(), // cents
        discount_amount: discountAmount.toString(), // cents
        final_price: finalPrice.toString(), // cents
        service_fee: Math.round(fees.serviceFee * 100).toString(), // cents
        attendee_pays: Math.round(fees.attendeePays * 100).toString(), // cents
        host_receives: Math.round(fees.hostReceives * 100).toString(), // cents
        currency: currency,
        invite_code: inviteCode || '',
        referral_invite_id: referralInvite?.id || '',
      },

      // Redirect URLs
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/activities/${activityId}?payment=cancelled`,

      // Optional settings
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_CONFIG.SESSION_EXPIRES_IN_SECONDS,
    })
    checkoutSessionIdForCleanup = checkoutSession.id

    await prisma.userActivity.update({
      where: { id: reservedBooking.id },
      data: { stripeCheckoutSessionId: checkoutSession.id },
    })

    // 12. Return checkout URL
    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error('Checkout session error:', error)

    const cleanupTasks: Promise<unknown>[] = []
    if (checkoutSessionIdForCleanup) {
      cleanupTasks.push(stripe.checkout.sessions.expire(checkoutSessionIdForCleanup))
    }
    if (reservedBookingId) {
      cleanupTasks.push(
        prisma.userActivity.update({
          where: { id: reservedBookingId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            deletedAt: new Date(),
            stripeCheckoutSessionId: checkoutSessionIdForCleanup,
          },
        })
      )
    }
    if (cleanupTasks.length > 0) {
      await Promise.allSettled(cleanupTasks)
    }

    if (error instanceof Error && error.message === 'ACTIVITY_FULL') {
      return NextResponse.json(
        { error: 'This activity is fully booked' },
        { status: 400 }
      )
    }

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes('Stripe')) {
      return NextResponse.json(
        { error: 'Payment service error. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
