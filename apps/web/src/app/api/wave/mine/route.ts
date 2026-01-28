import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  const waves = await prisma.waveActivity.findMany({
    where: {
      creatorId: userId,
      expiresAt: { gt: now },
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { startedAt: 'desc' },
  })

  return NextResponse.json({
    waves: waves.map((w) => ({
      id: w.id,
      activityType: w.activityType,
      area: w.area,
      thought: w.thought,
      participantCount: w._count.participants,
      startedAt: w.startedAt,
      expiresAt: w.expiresAt,
    })),
  })
}
