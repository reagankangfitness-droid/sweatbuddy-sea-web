import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params

    if (!accountId) {
      return NextResponse.json(
        { error: { message: 'Account ID is required' } },
        { status: 400 }
      )
    }

    const account = await stripe.accounts.retrieve(accountId)

    return NextResponse.json({
      id: account.id,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      country: account.country,
      defaultCurrency: account.default_currency,
    })
  } catch (error) {
    console.error('Error retrieving account status:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch account status'
    return NextResponse.json(
      { error: { message } },
      { status: 400 }
    )
  }
}
