import { NextResponse } from 'next/server'
import { getCurrentDbUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in?redirect_url=/for-organizers', request.url), 303)

  const community = await prisma.community.findFirst({
    where: {
      isActive: true,
      OR: [
        { claimedById: user.id },
        { createdById: user.id },
        { members: { some: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } } } },
      ],
    },
    select: { id: true, name: true, slug: true },
  })
  if (!community) return NextResponse.redirect(new URL('/explore?claim=required', request.url), 303)

  const organizerEmail = user.email.toLowerCase()
  const existing = await prisma.hostSubscription.findUnique({ where: { organizerEmail } })
  if (existing?.tier === 'PREMIUM' && existing.status === 'ACTIVE') {
    return NextResponse.redirect(new URL('/hub?club=active', request.url), 303)
  }

  const origin = new URL(request.url).origin
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: organizerEmail,
    allow_promotion_codes: true,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'sgd',
        unit_amount: 1500,
        recurring: { interval: 'month' },
        product_data: { name: 'SweatBuddies Founding Club' },
      },
    }],
    metadata: {
      flow: 'club_subscription',
      organizer_email: organizerEmail,
      user_id: user.id,
      community_id: community.id,
      community_slug: community.slug,
    },
    subscription_data: { metadata: { flow: 'club_subscription', organizer_email: organizerEmail } },
    success_url: `${origin}/hub?club=active&checkout={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/for-organizers?checkout=cancelled`,
  })

  if (!session.url) return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
  return NextResponse.redirect(session.url, 303)
}
