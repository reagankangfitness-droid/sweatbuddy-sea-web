import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export async function POST(request: Request) {
  try {
    const { accountId, eventSubmissionId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: { message: 'Account ID is required' } },
        { status: 400 }
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
