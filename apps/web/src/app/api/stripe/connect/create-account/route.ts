import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getOrganizerSession } from '@/lib/organizer-session'

export async function POST(request: Request) {
  try {
    const session = await getOrganizerSession()
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized - organizer session required' } },
        { status: 401 }
      )
    }

    const { email, eventSubmissionId } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required' } },
        { status: 400 }
      )
    }

    if (!eventSubmissionId) {
      return NextResponse.json(
        { error: { message: 'Event submission ID is required' } },
        { status: 400 }
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
      email: email,
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
        email: email,
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
    const message = error instanceof Error ? error.message : 'Failed to create account'
    return NextResponse.json(
      { error: { message } },
      { status: 400 }
    )
  }
}
