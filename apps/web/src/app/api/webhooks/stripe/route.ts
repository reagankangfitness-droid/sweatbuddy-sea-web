import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Retrieve session with line items to get payment details
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['line_items'],
          }
        )

        const { activityId, userId, userActivityId } = session.metadata || {}

        if (!activityId || !userId || !userActivityId) {
          console.error('Missing metadata in session:', session.id)
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          )
        }

        // Update UserActivity record
        await prisma.userActivity.update({
          where: { id: userActivityId },
          data: {
            status: 'JOINED',
            paymentStatus: 'PAID',
            stripePaymentIntentId: session.payment_intent as string,
            amountPaid: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
            paidAt: new Date(),
          },
        })

        console.log(`Payment successful for user ${userId} joining activity ${activityId}`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userActivityId } = session.metadata || {}

        if (userActivityId) {
          // Mark payment as failed when checkout session expires
          await prisma.userActivity.update({
            where: { id: userActivityId },
            data: {
              paymentStatus: 'FAILED',
            },
          })

          console.log(`Checkout session expired for userActivity ${userActivityId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find the UserActivity by payment intent ID
        const userActivity = await prisma.userActivity.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
        })

        if (userActivity) {
          await prisma.userActivity.update({
            where: { id: userActivity.id },
            data: {
              paymentStatus: 'FAILED',
            },
          })

          console.log(`Payment failed for userActivity ${userActivity.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
