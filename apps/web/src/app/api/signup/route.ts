import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
