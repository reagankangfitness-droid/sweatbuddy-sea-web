import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe, toStripeAmount, STRIPE_CONFIG } from '@/lib/stripe'
import { calculateFees } from '@/lib/constants/fees'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
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

    // 3. Get user from database (synced from Clerk)
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
    })

    if (!user) {
      // Try to sync user from Clerk
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkUserId)

      await prisma.user.upsert({
        where: { id: clerkUserId },
        update: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
          imageUrl: clerkUser.imageUrl || null,
        },
        create: {
          id: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      })
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
    if (clerkUserId === hostId) {
      return NextResponse.json(
        { error: 'You cannot book your own activity' },
        { status: 400 }
      )
    }

    // 7. Check if user already has a booking
    const existingBooking = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId: clerkUserId,
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
      // Create or update booking directly without Stripe
      const booking = await prisma.userActivity.upsert({
        where: {
          userId_activityId: {
            userId: clerkUserId,
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
          userId: clerkUserId,
          activityId: activityId,
          status: 'JOINED',
          paymentStatus: 'FREE',
          amountPaid: 0,
          currency: currency,
          paidAt: new Date(),
        },
      })

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
            friendUserId: clerkUserId,
            userActivityId: booking.id,
            discountType: 'FREE',
            discountValue: 100,
            discountAmount: activity.price,
          },
        })
      }

      // Add user to activity group chat
      const activityGroup = await prisma.group.findFirst({
        where: { activityId: activityId },
      })

      if (activityGroup) {
        await prisma.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: clerkUserId,
              groupId: activityGroup.id,
            },
          },
          update: {
            deletedAt: null,
          },
          create: {
            userId: clerkUserId,
            groupId: activityGroup.id,
            role: 'MEMBER',
          },
        })
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

    // Get user email for Stripe customer
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress

    // Calculate fees using new fee structure (3.7% + $1.79 per ticket)
    const fees = calculateFees(finalPrice, 1)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      // Customer info
      customer_email: userEmail,

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
            unit_amount: toStripeAmount(finalPrice, currency),
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
                  unit_amount: toStripeAmount(fees.serviceFee, currency),
                },
                quantity: 1,
              },
            ]
          : []),
      ],

      // Metadata for webhook processing
      metadata: {
        activity_id: activityId,
        user_id: clerkUserId,
        host_id: hostId,
        original_price: activity.price.toString(),
        discount_amount: discountAmount.toString(),
        final_price: finalPrice.toString(),
        service_fee: fees.serviceFee.toString(),
        attendee_pays: fees.attendeePays.toString(),
        host_receives: fees.hostReceives.toString(),
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

    // 11. Create or update pending booking record
    // Note: amountPaid is the ticket price (what host receives)
    // Total paid by attendee = amountPaid + serviceFee
    await prisma.userActivity.upsert({
      where: {
        userId_activityId: {
          userId: clerkUserId,
          activityId: activityId,
        },
      },
      update: {
        status: 'INTERESTED', // Will be updated to JOINED after payment
        paymentStatus: 'PENDING',
        stripeCheckoutSessionId: checkoutSession.id,
        amountPaid: fees.attendeePays, // Total amount attendee pays
        currency: currency,
        deletedAt: null,
      },
      create: {
        userId: clerkUserId,
        activityId: activityId,
        status: 'INTERESTED',
        paymentStatus: 'PENDING',
        stripeCheckoutSessionId: checkoutSession.id,
        amountPaid: fees.attendeePays, // Total amount attendee pays
        currency: currency,
      },
    })

    // 12. Return checkout URL
    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error('Checkout session error:', error)

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
