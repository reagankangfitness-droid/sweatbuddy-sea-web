import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export async function POST(request: Request) {
  try {
    // Auth check - only allow authenticated hosts
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { accountId, eventSubmissionId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: { message: 'Account ID is required' } },
        { status: 400 }
      )
    }

    // Verify this account belongs to the authenticated host
    const hostAccount = await prisma.hostStripeAccount.findFirst({
      where: {
        stripeConnectAccountId: accountId,
      },
    })

    if (!hostAccount) {
      return NextResponse.json(
        { error: { message: 'Account not found' } },
        { status: 404 }
      )
    }

    // Get the event submission to verify ownership
    const eventSubmission = await prisma.eventSubmission.findUnique({
      where: { id: hostAccount.eventSubmissionId },
      select: { organizerInstagram: true },
    })

    if (!eventSubmission || eventSubmission.organizerInstagram?.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json(
        { error: { message: 'Unauthorized - account does not belong to you' } },
        { status: 403 }
      )
    }

    // Build return/refresh URLs with event context if provided
    const returnUrl = eventSubmissionId
      ? `${BASE_URL}/host/events/${eventSubmissionId}/edit?stripe_onboarding=complete`
      : `${BASE_URL}/host/dashboard?stripe_onboarding=complete`

    const refreshUrl = eventSubmissionId
      ? `${BASE_URL}/host/events/${eventSubmissionId}/edit?stripe_onboarding=refresh`
      : `${BASE_URL}/host/dashboard?stripe_onboarding=refresh`

    // Create an account link for Express onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating account link:', error)
    const message = error instanceof Error ? error.message : 'Failed to create account link'
    return NextResponse.json(
      { error: { message } },
      { status: 400 }
    )
  }
}
