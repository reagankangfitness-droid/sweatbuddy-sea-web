import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sessions = await prisma.activity.findMany({
      where: {
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        deletedAt: null,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
