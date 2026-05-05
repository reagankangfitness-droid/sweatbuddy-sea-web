import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getHostSession } from '@/lib/auth'
import { isHostEventOwner } from '@/lib/host-ownership'

export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized - organizer session required' } },
        { status: 401 }
      )
    }

    const { eventSubmissionId } = await request.json()

    if (!eventSubmissionId) {
      return NextResponse.json(
        { error: { message: 'Event submission ID is required' } },
        { status: 400 }
      )
    }

    const eventSubmission = await prisma.eventSubmission.findUnique({
      where: { id: eventSubmissionId },
      select: { organizerInstagram: true, submittedByUserId: true },
    })

    if (!eventSubmission || !isHostEventOwner(session, eventSubmission)) {
      return NextResponse.json(
        { error: { message: 'Unauthorized - event does not belong to you' } },
        { status: 403 }
      )
    }

    // Check if account already exists for this event
    const existingAccount = await prisma.hostStripeAccount.findUnique({
      where: { eventSubmissionId },
    })

    if (existingAccount) {
      // Return existing account - host can continue onboarding
      return NextResponse.json({
        accountId: existingAccount.stripeConnectAccountId,
        email: existingAccount.email,
        existing: true,
      })
    }

    // Create a Connect account with Express type for Singapore
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'SG',
      email: session.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        eventSubmissionId: eventSubmissionId,
        platform: 'sweatbuddies',
      },
    })

    // Save the Stripe account to our database
    await prisma.hostStripeAccount.create({
      data: {
        eventSubmissionId,
        stripeConnectAccountId: account.id,
        email: session.email,
        country: 'SG',
        chargesEnabled: false,
        payoutsEnabled: false,
        stripeOnboardingComplete: false,
      },
    })

    // Successfully created Stripe Connect account

    return NextResponse.json({
      accountId: account.id,
      email: account.email,
      existing: false,
    })
  } catch (error) {
    console.error('Error creating Connect account:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Something went wrong' : (error instanceof Error ? error.message : 'Failed to create account')
    return NextResponse.json(
      { error: { message } },
      { status: 400 }
    )
  }
}
