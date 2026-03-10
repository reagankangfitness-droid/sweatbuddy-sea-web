/**
 * P2P Stripe Connect — Clerk-authenticated route
 *
 * Separate from the organizer Stripe Connect flow (/api/stripe/connect/*) which
 * uses OrganizerMagicLink auth and stores account IDs in HostStripeAccount.
 *
 * This endpoint uses Clerk auth and stores the Connect account ID directly on
 * User.p2pStripeConnectId — required before a user can create P2P_PAID sessions.
 *
 * POST /api/stripe/connect/p2p
 *   - Creates (or retrieves) a Stripe Express account for the authenticated user
 *   - Generates an onboarding account link
 *   - Saves accountId to User.p2pStripeConnectId
 *   - Returns { url } for redirect to Stripe onboarding
 */
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, p2pStripeConnectId: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let accountId = dbUser.p2pStripeConnectId

    // Create a new Stripe Express account if the user doesn't have one yet
    if (!accountId) {
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
          userId: dbUser.id,
          platform: 'sweatbuddies_p2p',
        },
      })

      accountId = account.id

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { p2pStripeConnectId: accountId },
      })
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${BASE_URL}/buddy/host/connect?refresh=true`,
      return_url: `${BASE_URL}/buddy/host/connect?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId })
  } catch (error) {
    console.error('[stripe/connect/p2p] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create Connect account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/stripe/connect/p2p
 * Returns the current user's P2P Stripe Connect status.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, p2pStripeConnectId: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!dbUser.p2pStripeConnectId) {
      return NextResponse.json({ connected: false, chargesEnabled: false })
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(dbUser.p2pStripeConnectId)

    return NextResponse.json({
      connected: true,
      accountId: dbUser.p2pStripeConnectId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error) {
    console.error('[stripe/connect/p2p] GET Error:', error)
    return NextResponse.json({ error: 'Failed to get connect status' }, { status: 500 })
  }
}
