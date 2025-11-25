import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, fromStripeAmount } from '@/lib/stripe'

// Disable body parsing - Stripe requires raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Webhook error: No stripe-signature header')
    return NextResponse.json(
      { error: 'No stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Webhook error: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle successful checkout
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const sessionId = session.id
  const paymentIntentId = session.payment_intent as string | null
  const metadata = session.metadata || {}
  const amountTotal = session.amount_total || 0
  const currency = session.currency?.toUpperCase() || 'SGD'

  const {
    activity_id: activityId,
    user_id: userId,
    host_id: hostId,
    invite_code: inviteCode,
    referral_invite_id: referralInviteId,
    original_price: originalPrice,
    discount_amount: discountAmount,
  } = metadata

  if (!activityId || !userId) {
    console.error('Missing metadata in checkout session:', sessionId)
    return
  }

  console.log(`Processing checkout completion for session ${sessionId}`)

  try {
    // Use transaction to ensure all updates succeed together
    await prisma.$transaction(async (tx) => {
      // 1. Find and update the booking (UserActivity)
      const booking = await tx.userActivity.findFirst({
        where: {
          stripeCheckoutSessionId: sessionId,
        },
      })

      if (!booking) {
        console.error('Booking not found for session:', sessionId)
        throw new Error('Booking not found')
      }

      // 2. Update booking to confirmed
      await tx.userActivity.update({
        where: { id: booking.id },
        data: {
          status: 'JOINED',
          paymentStatus: 'PAID',
          stripePaymentIntentId: paymentIntentId,
          amountPaid: fromStripeAmount(amountTotal, currency),
          currency: currency,
          paidAt: new Date(),
        },
      })

      // 3. Create payment record for audit trail
      await tx.payment.create({
        data: {
          userActivityId: booking.id,
          userId: userId,
          activityId: activityId,
          hostId: hostId || null,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          amount: fromStripeAmount(amountTotal, currency),
          currency: currency,
          status: 'PAID',
          originalAmount: originalPrice ? parseFloat(originalPrice) : null,
          discountAmount: discountAmount ? parseFloat(discountAmount) : null,
          discountCode: inviteCode || null,
          referralInviteId: referralInviteId || null,
          paidAt: new Date(),
        },
      })

      // 4. Handle referral conversion
      if (referralInviteId) {
        await tx.referralInvite.update({
          where: { id: referralInviteId },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            friendDiscountApplied: true,
          },
        })

        await tx.referralConversion.create({
          data: {
            inviteId: referralInviteId,
            friendUserId: userId,
            userActivityId: booking.id,
            discountType: 'PERCENTAGE',
            discountValue: 50,
            discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
          },
        })
      }

      // 5. Add user to activity group chat
      const activityGroup = await tx.group.findFirst({
        where: { activityId: activityId },
      })

      if (activityGroup) {
        await tx.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: userId,
              groupId: activityGroup.id,
            },
          },
          update: {
            deletedAt: null,
          },
          create: {
            userId: userId,
            groupId: activityGroup.id,
            role: 'MEMBER',
          },
        })
      }
    })

    console.log(`✅ Booking confirmed for session ${sessionId}`)

    // TODO: Send confirmation email to user
    // TODO: Send notification to host
  } catch (error) {
    console.error('Error handling checkout completion:', error)
    throw error
  }
}

// Handle expired checkout session
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const sessionId = session.id

  console.log(`Checkout expired for session ${sessionId}`)

  try {
    await prisma.userActivity.updateMany({
      where: {
        stripeCheckoutSessionId: sessionId,
        status: 'INTERESTED', // Only update pending bookings
        paymentStatus: 'PENDING',
      },
      data: {
        paymentStatus: 'EXPIRED',
      },
    })

    console.log(`⏰ Checkout marked as expired for session ${sessionId}`)
  } catch (error) {
    console.error('Error handling checkout expiry:', error)
  }
}

// Handle successful payment (backup handler)
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`)
  // This is a backup - checkout.session.completed should handle most cases
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id
  const errorMessage = paymentIntent.last_payment_error?.message

  console.log(`❌ Payment failed: ${paymentIntentId}`, errorMessage)

  try {
    await prisma.userActivity.updateMany({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        paymentStatus: 'FAILED',
      },
    })
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Handle refunds
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string | null
  const amountRefunded = charge.amount_refunded
  const currency = charge.currency.toUpperCase()

  if (!paymentIntentId) {
    console.log('Refund without payment intent ID')
    return
  }

  console.log(`💸 Processing refund for payment intent: ${paymentIntentId}`)

  try {
    // Find the booking by payment intent
    const booking = await prisma.userActivity.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { activity: true },
    })

    if (!booking) {
      console.error('Booking not found for refund:', paymentIntentId)
      return
    }

    const refundAmount = fromStripeAmount(amountRefunded, currency)
    const isFullRefund = amountRefunded >= (charge.amount || 0)

    // Update booking
    await prisma.userActivity.update({
      where: { id: booking.id },
      data: {
        status: isFullRefund ? 'CANCELLED' : booking.status,
        paymentStatus: 'REFUNDED',
        refundAmount: refundAmount,
        refundedAt: new Date(),
      },
    })

    // Update payment record
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    })

    // If full refund, remove user from group chat
    if (isFullRefund) {
      const activityGroup = await prisma.group.findFirst({
        where: { activityId: booking.activityId },
      })

      if (activityGroup) {
        await prisma.userGroup.updateMany({
          where: {
            userId: booking.userId,
            groupId: activityGroup.id,
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    }

    console.log(`💸 Refund processed: ${paymentIntentId} - Amount: ${refundAmount} ${currency}`)
  } catch (error) {
    console.error('Error handling refund:', error)
  }
}
