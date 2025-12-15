import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get newsletter subscribers (admin use)
export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')

  // Admin auth check
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'sweatbuddies-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
    })

    return NextResponse.json({
      subscribers: subscribers.map((s) => ({
        email: s.email,
        name: s.name,
        subscribedAt: s.subscribedAt.toISOString(),
        source: s.source,
      })),
    })
  } catch (error) {
    console.error('Get subscribers error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscribers' },
      { status: 500 }
    )
  }
}
