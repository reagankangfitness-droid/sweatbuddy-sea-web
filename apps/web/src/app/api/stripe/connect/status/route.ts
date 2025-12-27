import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: { message: 'Event ID is required' } },
        { status: 400 }
      )
    }

    // Find the host's Stripe account for this event
    const hostStripeAccount = await prisma.hostStripeAccount.findUnique({
      where: { eventSubmissionId: eventId },
      select: {
        stripeConnectAccountId: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        stripeOnboardingComplete: true,
        email: true,
      },
    })

    if (!hostStripeAccount) {
      return NextResponse.json({
        exists: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
      })
    }

    return NextResponse.json({
      exists: true,
      accountId: hostStripeAccount.stripeConnectAccountId,
      chargesEnabled: hostStripeAccount.chargesEnabled,
      payoutsEnabled: hostStripeAccount.payoutsEnabled,
      onboardingComplete: hostStripeAccount.stripeOnboardingComplete,
      email: hostStripeAccount.email,
    })
  } catch (error) {
    console.error('Error fetching Stripe status:', error)
    return NextResponse.json(
      { error: { message: 'Failed to fetch Stripe status' } },
      { status: 500 }
    )
  }
}
