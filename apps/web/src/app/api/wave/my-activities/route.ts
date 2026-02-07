import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user's database ID
    const dbUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true },
    })

    if (!dbUser) {
      return NextResponse.json({ activities: [] })
    }

    // Get all waves created by this user (active and expired, last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const waves = await prisma.waveActivity.findMany({
      where: {
        creatorId: dbUser.id,
        startedAt: { gte: thirtyDaysAgo },
      },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    const activities = waves.map((w) => ({
      id: w.id,
      activityType: w.activityType,
      area: w.area,
      locationName: w.locationName,
      thought: w.thought,
      participantCount: w._count.participants,
      waveThreshold: w.waveThreshold,
      isUnlocked: w.isUnlocked,
      chatId: w.chatId,
      startedAt: w.startedAt.toISOString(),
      expiresAt: w.expiresAt.toISOString(),
      scheduledFor: w.scheduledFor?.toISOString() || null,
    }))

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching my activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
