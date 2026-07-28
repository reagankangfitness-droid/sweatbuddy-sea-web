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
    const aggregatorEventDefinitions = [
      { key: 'detailViews', event: EVENTS.COMMUNITY_VIEWED },
      { key: 'saves', event: EVENTS.COMMUNITY_SAVED },
      { key: 'officialJoinClicks', event: EVENTS.OFFICIAL_JOIN_CLICKED },
      { key: 'joinedConfirmations', event: EVENTS.COMMUNITY_OUTBOUND_JOIN_CONFIRMED },
      { key: 'weeklyPickSignups', event: EVENTS.COMMUNITY_WEEKLY_PICKS_SUBMITTED },
      { key: 'claimIntents', event: EVENTS.COMMUNITY_CLAIM_INTENT_CLICKED },
      { key: 'outdatedReports', event: EVENTS.COMMUNITY_REPORT_OUTDATED_CLICKED },
      { key: 'shares', event: EVENTS.COMMUNITY_SHARE_CLICKED },
    ] as const
    const aggregatorCounts = await Promise.all(
      aggregatorEventDefinitions.flatMap(({ event }) => [
        prisma.analyticsEvent.count({ where: { event, createdAt: { gte: sevenDaysAgo } } }),
        prisma.analyticsEvent.count({ where: { event, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.analyticsEvent.count({ where: { event } }),
      ]),
    )
    const aggregatorFunnel = Object.fromEntries(
      aggregatorEventDefinitions.map((definition, index) => {
        const offset = index * 3
        return [
          definition.key,
          {
            last7Days: aggregatorCounts[offset],
            last30Days: aggregatorCounts[offset + 1],
            allTime: aggregatorCounts[offset + 2],
          },
        ]
      }),
    )

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
    const recentAggregatorEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: {
          in: [
            EVENTS.COMMUNITY_VIEWED,
            EVENTS.COMMUNITY_SAVED,
            EVENTS.OFFICIAL_JOIN_CLICKED,
            EVENTS.COMMUNITY_OUTBOUND_JOIN_CONFIRMED,
            EVENTS.COMMUNITY_WEEKLY_PICKS_SUBMITTED,
            EVENTS.COMMUNITY_CLAIM_INTENT_CLICKED,
            EVENTS.COMMUNITY_REPORT_OUTDATED_CLICKED,
            EVENTS.COMMUNITY_SHARE_CLICKED,
          ],
        },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        event: true,
        metadata: true,
      },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    })
    const topAggregatorCommunities = summarizeAggregatorCommunities(recentAggregatorEvents)

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
      aggregatorFunnel,
      topAggregatorCommunities,
      joinsPerCommunity,
      dailyJoinTrend,
    })
  } catch (error) {
    console.error('PMF metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function summarizeAggregatorCommunities(
  events: Array<{ event: string; metadata: unknown }>,
) {
  const byCommunity = new Map<string, {
    communitySlug: string
    communityName: string
    detailViews: number
    saves: number
    officialJoinClicks: number
    joinedConfirmations: number
    weeklyPickSignups: number
    claimIntents: number
    outdatedReports: number
    shares: number
  }>()

  for (const event of events) {
    const metadata = event.metadata as Record<string, unknown> | null
    const communitySlug = typeof metadata?.communitySlug === 'string' ? metadata.communitySlug : ''
    const communityName = typeof metadata?.communityName === 'string' ? metadata.communityName : ''

    if (!communitySlug && !communityName) continue

    const key = communitySlug || communityName.toLowerCase()
    const existing = byCommunity.get(key) ?? {
      communitySlug,
      communityName,
      detailViews: 0,
      saves: 0,
      officialJoinClicks: 0,
      joinedConfirmations: 0,
      weeklyPickSignups: 0,
      claimIntents: 0,
      outdatedReports: 0,
      shares: 0,
    }

    if (!existing.communitySlug && communitySlug) existing.communitySlug = communitySlug
    if (!existing.communityName && communityName) existing.communityName = communityName

    switch (event.event) {
      case EVENTS.COMMUNITY_VIEWED:
        existing.detailViews += 1
        break
      case EVENTS.COMMUNITY_SAVED:
        existing.saves += 1
        break
      case EVENTS.OFFICIAL_JOIN_CLICKED:
        existing.officialJoinClicks += 1
        break
      case EVENTS.COMMUNITY_OUTBOUND_JOIN_CONFIRMED:
        existing.joinedConfirmations += 1
        break
      case EVENTS.COMMUNITY_WEEKLY_PICKS_SUBMITTED:
        existing.weeklyPickSignups += 1
        break
      case EVENTS.COMMUNITY_CLAIM_INTENT_CLICKED:
        existing.claimIntents += 1
        break
      case EVENTS.COMMUNITY_REPORT_OUTDATED_CLICKED:
        existing.outdatedReports += 1
        break
      case EVENTS.COMMUNITY_SHARE_CLICKED:
        existing.shares += 1
        break
    }

    byCommunity.set(key, existing)
  }

  return Array.from(byCommunity.values())
    .map((community) => ({
      ...community,
      intentScore:
        community.officialJoinClicks * 3 +
        community.joinedConfirmations * 4 +
        community.saves * 2 +
        community.detailViews +
        community.weeklyPickSignups * 2 +
        community.claimIntents * 3 +
        community.outdatedReports +
        community.shares,
    }))
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, 10)
}
