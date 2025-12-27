import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getHostSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get the host's Stripe account for this event
    const hostAccount = await prisma.hostStripeAccount.findUnique({
      where: { eventSubmissionId: eventId },
    })

    if (!hostAccount) {
      return NextResponse.json(
        { error: 'No Stripe account found for this event' },
        { status: 404 }
      )
    }

    // Verify ownership
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true },
    })

    if (!event || event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create Express Dashboard login link
    const loginLink = await stripe.accounts.createLoginLink(
      hostAccount.stripeConnectAccountId
    )

    return NextResponse.json({ url: loginLink.url })
  } catch (error) {
    console.error('Stripe dashboard link error:', error)

    // Handle specific Stripe errors
    if (error instanceof Error && error.message.includes('not yet ready')) {
      return NextResponse.json(
        { error: 'Please complete Stripe onboarding first' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    )
  }
}
