import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns'
import { EVENTS } from '@/lib/analytics'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = startOfDay(subDays(now, 7))
    const thirtyDaysAgo = startOfDay(subDays(now, 30))

    // Count events by type for different time ranges
    const [
      signupsAll,
      signups7d,
      signups30d,
      communitiesCreatedAll,
      communitiesCreated7d,
      communitiesCreated30d,
      joinsAll,
      joins7d,
      joins30d,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { event: EVENTS.SIGNUP } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.SIGNUP, createdAt: { gte: sevenDaysAgo } } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.SIGNUP, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_CREATED } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_CREATED, createdAt: { gte: sevenDaysAgo } } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_CREATED, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_JOINED } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_JOINED, createdAt: { gte: sevenDaysAgo } } }),
      prisma.analyticsEvent.count({ where: { event: EVENTS.COMMUNITY_JOINED, createdAt: { gte: thirtyDaysAgo } } }),
    ])

    // Top 10 communities by joins
    const topCommunityJoins = await prisma.analyticsEvent.groupBy({
      by: ['metadata'],
      where: { event: EVENTS.COMMUNITY_JOINED },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50, // fetch more, then deduplicate by communityId client-side
    })

    // Deduplicate and extract community info from metadata
    const communityMap = new Map<string, { communityId: string; communitySlug: string; communityName: string; count: number }>()
    for (const row of topCommunityJoins) {
      const meta = row.metadata as Record<string, unknown> | null
      const communityId = meta?.communityId as string | undefined
      if (communityId && !communityMap.has(communityId)) {
        communityMap.set(communityId, {
          communityId,
          communitySlug: (meta?.communitySlug as string) || '',
          communityName: (meta?.communityName as string) || '',
          count: row._count.id,
        })
      } else if (communityId && communityMap.has(communityId)) {
        const existing = communityMap.get(communityId)!
        existing.count += row._count.id
      }
    }
    const joinsPerCommunity = Array.from(communityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Daily join trend (last 14 days)
    const fourteenDaysAgo = startOfDay(subDays(now, 14))
    const dailyJoins = await prisma.analyticsEvent.findMany({
      where: {
        event: EVENTS.COMMUNITY_JOINED,
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
    })

    const days = eachDayOfInterval({ start: fourteenDaysAgo, end: now })
    const dailyJoinTrend = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = dailyJoins.filter(
        (j) => format(j.createdAt, 'yyyy-MM-dd') === dayStr
      ).length
      return { date: dayStr, count }
    })

    return NextResponse.json({
      signups: {
        last7Days: signups7d,
        last30Days: signups30d,
        allTime: signupsAll,
      },
      communitiesCreated: {
        last7Days: communitiesCreated7d,
        last30Days: communitiesCreated30d,
        allTime: communitiesCreatedAll,
      },
      communityJoins: {
        last7Days: joins7d,
        last30Days: joins30d,
        allTime: joinsAll,
      },
      joinsPerCommunity,
      dailyJoinTrend,
    })
  } catch (error) {
    console.error('PMF metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
