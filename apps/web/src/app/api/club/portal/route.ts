import { NextResponse } from 'next/server'
import { getCurrentDbUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in?redirect_url=/hub', request.url), 303)
  const subscription = await prisma.hostSubscription.findUnique({
    where: { organizerEmail: user.email.toLowerCase() },
    select: { stripeCustomerId: true },
  })
  if (!subscription?.stripeCustomerId) return NextResponse.redirect(new URL('/for-organizers', request.url), 303)
  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${new URL(request.url).origin}/hub`,
  })
  return NextResponse.redirect(portal.url, 303)
}
