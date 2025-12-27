import { NextResponse } from 'next/server'
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
    const body: CreateCheckoutRequest = await request.json()
    const { eventId, attendeeEmail, attendeeName, quantity = 1 } = body

    if (!eventId || !attendeeEmail || !attendeeName) {
      return NextResponse.json(
        { error: { message: 'Event ID, email, and name are required' } },
        { status: 400 }
      )
    }

    // Fetch the event
    const event = await prisma.eventSubmission.findUnique({
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

    if (!event) {
      return NextResponse.json(
        { error: { message: 'Event not found' } },
        { status: 404 }
      )
    }

    if (event.isFree || !event.price) {
      return NextResponse.json(
        { error: { message: 'This is a free event' } },
        { status: 400 }
      )
    }

    if (!event.stripeEnabled) {
      return NextResponse.json(
        { error: { message: 'Stripe payments are not enabled for this event' } },
        { status: 400 }
      )
    }

    // Check capacity
    if (event.maxTickets && event.ticketsSold + quantity > event.maxTickets) {
      return NextResponse.json(
        { error: { message: 'Not enough tickets available' } },
        { status: 400 }
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
    const fees = calculateFees(event.price, false, feeHandling)

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
    console.error('Error creating checkout session:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    )
  }
}
