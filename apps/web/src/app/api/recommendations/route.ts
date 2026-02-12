import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRecommendedEvents, getTrendingEvents } from '@/lib/recommendations'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up user email (bridge userId -> email for EventAttendance queries)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const events = await getRecommendedEvents(userId, user.email)

    if (events.length > 0) {
      return NextResponse.json({ events, source: 'personalized' })
    }

    // Fallback for new users with no history
    const trending = await getTrendingEvents()
    return NextResponse.json({ events: trending, source: 'trending' })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
