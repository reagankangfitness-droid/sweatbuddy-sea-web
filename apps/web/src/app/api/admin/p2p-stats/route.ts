import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      totalUsers,
      usersOnboarded,
      p2pFreeSessions,
      p2pPaidSessions,
      marketplaceSessions,
      upcomingSessions,
      totalAttendances,
      attendanceGroups,
      topHosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { p2pOnboardingCompleted: true } }),
      prisma.activity.count({
        where: { activityMode: 'P2P_FREE', deletedAt: null },
      }),
      prisma.activity.count({
        where: { activityMode: 'P2P_PAID', deletedAt: null },
      }),
      prisma.activity.count({
        where: { activityMode: 'MARKETPLACE', deletedAt: null },
      }),
      prisma.activity.count({
        where: {
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          status: 'PUBLISHED',
          startTime: { gte: new Date() },
          deletedAt: null,
        },
      }),
      prisma.userActivity.count({
        where: { status: { in: ['JOINED', 'COMPLETED'] } },
      }),
      prisma.userActivity.groupBy({
        by: ['activityId'],
        where: { status: { in: ['JOINED', 'COMPLETED'] } },
        _count: { activityId: true },
      }),
      prisma.user.findMany({
        where: { sessionsHostedCount: { gt: 0 } },
        select: {
          name: true,
          email: true,
          imageUrl: true,
          sessionsHostedCount: true,
          sessionsAttendedCount: true,
        },
        orderBy: { sessionsHostedCount: 'desc' },
        take: 5,
      }),
    ])

    const totalP2PSessions = p2pFreeSessions + p2pPaidSessions

    const avgAttendeesPerSession = attendanceGroups.length > 0
      ? Math.round(
          (attendanceGroups.reduce((sum, g) => sum + g._count.activityId, 0) / attendanceGroups.length) * 10
        ) / 10
      : 0

    return NextResponse.json({
      totalUsers,
      usersOnboarded,
      totalP2PSessions,
      p2pFreeSessions,
      p2pPaidSessions,
      marketplaceSessions,
      upcomingSessions,
      totalAttendances,
      avgAttendeesPerSession,
      topHosts,
    })
  } catch (error) {
    console.error('P2P stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
