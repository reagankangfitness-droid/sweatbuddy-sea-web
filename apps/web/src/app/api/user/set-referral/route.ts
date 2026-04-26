import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { trackEvent } from '@/lib/analytics'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { referredBy } = await req.json()
    if (!referredBy || typeof referredBy !== 'string') {
      return NextResponse.json({ error: 'Invalid referral' }, { status: 400 })
    }

    // Verify the referrer exists
    const referrer = await prisma.user.findUnique({
      where: { id: referredBy },
      select: { id: true },
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 })
    }

    // Log the referral event
    console.log(`[referral] User ${userId} was referred by ${referredBy}`)
    await trackEvent('referral_signup', userId, { referredBy })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting referral:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
