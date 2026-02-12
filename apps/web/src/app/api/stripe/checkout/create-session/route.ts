import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, calculateFees } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

interface CreateCheckoutRequest {
  eventId: string
  attendeeEmail: string
  attendeeName: string
  quantity?: number
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body: CreateCheckoutRequest = await request.json()
    const { eventId, attendeeEmail, attendeeName, quantity = 1 } = body

    if (!eventId || !attendeeEmail || !attendeeName) {
      return NextResponse.json(
        { error: { message: 'Event ID, email, and name are required' } },
        { status: 400 }
      )
    }

    // Atomically check capacity and reserve tickets in a transaction
    const event = await prisma.$transaction(async (tx) => {
      const ev = await tx.eventSubmission.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          slug: true,
          eventName: true,
          price: true,
          currency: true,
          isFree: true,
          stripeEnabled: true,
          feeHandling: true,
          maxTickets: true,
          ticketsSold: true,
          organizerInstagram: true,
          contactEmail: true,
        },
      })

      if (!ev) throw new Error('EVENT_NOT_FOUND')
      if (ev.isFree || !ev.price) throw new Error('FREE_EVENT')
      if (!ev.stripeEnabled) throw new Error('STRIPE_NOT_ENABLED')

      // Atomic capacity check
      if (ev.maxTickets && ev.ticketsSold + quantity > ev.maxTickets) {
        throw new Error('NOT_ENOUGH_TICKETS')
      }

      // Reserve tickets atomically
      if (ev.maxTickets) {
        await tx.eventSubmission.update({
          where: { id: eventId },
          data: { ticketsSold: { increment: quantity } },
        })
      }

      return ev
    })

    if (!event) {
      return NextResponse.json(
        { error: { message: 'Event not found' } },
        { status: 404 }
      )
    }

    // Get host's Stripe account
    const hostStripeAccount = await prisma.hostStripeAccount.findUnique({
      where: { eventSubmissionId: eventId },
    })

    if (!hostStripeAccount || !hostStripeAccount.chargesEnabled) {
      return NextResponse.json(
        { error: { message: 'Host has not completed Stripe setup' } },
        { status: 400 }
      )
    }

    // Calculate fees
    const feeHandling = event.feeHandling || 'ABSORB'
    const fees = calculateFees(event.price!, false, feeHandling)

    // The amount to charge the customer
    const unitAmount = fees.totalChargedToAttendee

    // Create Stripe Checkout Session with destination charges
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: attendeeEmail,
      line_items: [
        {
          price_data: {
            currency: event.currency?.toLowerCase() || 'sgd',
            product_data: {
              name: event.eventName,
              description: `Ticket for ${event.eventName}`,
              metadata: {
                eventId: event.id,
              },
            },
            unit_amount: unitAmount,
          },
          quantity,
        },
      ],
      payment_intent_data: {
        // Platform takes application fee (platform fee only, Stripe fee is separate)
        application_fee_amount: fees.platformFee * quantity,
        // Funds go to host's connected account
        transfer_data: {
          destination: hostStripeAccount.stripeConnectAccountId,
        },
        metadata: {
          eventId: event.id,
          attendeeEmail,
          attendeeName,
          quantity: String(quantity),
        },
      },
      success_url: `${BASE_URL}/e/${event.slug || event.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/e/${event.slug || event.id}?payment=cancelled`,
      metadata: {
        eventId: event.id,
        attendeeEmail,
        attendeeName,
        quantity: String(quantity),
        ticketPrice: String(event.price),
        platformFee: String(fees.platformFee),
        feeHandling,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'EVENT_NOT_FOUND') {
      return NextResponse.json({ error: { message: 'Event not found' } }, { status: 404 })
    }
    if (msg === 'FREE_EVENT') {
      return NextResponse.json({ error: { message: 'This is a free event' } }, { status: 400 })
    }
    if (msg === 'STRIPE_NOT_ENABLED') {
      return NextResponse.json({ error: { message: 'Stripe payments are not enabled for this event' } }, { status: 400 })
    }
    if (msg === 'NOT_ENOUGH_TICKETS') {
      return NextResponse.json({ error: { message: 'Not enough tickets available' } }, { status: 400 })
    }
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create checkout session' } },
      { status: 500 }
    )
  }
}
