import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    // Auth check - only allow hosts to check their own accounts
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { accountId } = await params

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
