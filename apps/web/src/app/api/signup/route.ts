import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'auth')
    if (rateLimited) return rateLimited

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: trimmed },
      update: { source: 'landing_signup', isActive: true },
      create: { email: trimmed, source: 'landing_signup' },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
