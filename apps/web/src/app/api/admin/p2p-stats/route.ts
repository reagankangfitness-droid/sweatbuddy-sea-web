import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  CITY_LOCATION_CONFIGS,
  CityLocationConfig,
  getUtcDateRangeForLocalDate,
} from '@/lib/location-config'

type AnalyticsMetadata = Record<string, unknown>

function metadataRecord(metadata: Prisma.JsonValue | null): AnalyticsMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {}
  return metadata as AnalyticsMetadata
}

function metadataString(metadata: AnalyticsMetadata, key: string): string | null {
  const value = metadata[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function metadataSessionId(metadata: AnalyticsMetadata): string | null {
  return metadataString(metadata, 'sessionId') ?? metadataString(metadata, 'activityId')
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function getLocalDateString(timezone: string, offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA', { timeZone: timezone })
}

function cityBoundsWhere(city: CityLocationConfig): Pick<Prisma.ActivityWhereInput, 'latitude' | 'longitude'> {
  const radiusKm = city.defaultRadius
  const latDelta = radiusKm / 111
  const lngDelta = radiusKm / (111 * Math.cos(city.center.lat * (Math.PI / 180)))

  return {
    latitude: { gte: city.center.lat - latDelta, lte: city.center.lat + latDelta },
    longitude: { gte: city.center.lng - lngDelta, lte: city.center.lng + lngDelta },
  }
}

function publicMapBaseWhere(city?: CityLocationConfig): Prisma.ActivityWhereInput {
  return {
    activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
    status: 'PUBLISHED',
    moderationStatus: 'LIVE',
    startTime: { gt: new Date() },
    deletedAt: null,
    ...(city ? cityBoundsWhere(city) : {}),
  }
}

function scoreReadiness({
  visibleToday,
  tomorrowVisible,
  nextSevenDaysVisible,
  openSpotSessions,
  beginnerFriendly,
  withAttendees,
  missingImage,
  likelyFallbackLocation,
}: {
  visibleToday: number
  tomorrowVisible: number
  nextSevenDaysVisible: number
  openSpotSessions: number
  beginnerFriendly: number
  withAttendees: number
  missingImage: number
  likelyFallbackLocation: number
}) {
  const todayScore = Math.min(visibleToday / 3, 1) * 30
  const tomorrowScore = Math.min(tomorrowVisible / 3, 1) * 15
  const weekScore = Math.min(nextSevenDaysVisible / 10, 1) * 20
  const joinableScore = Math.min(openSpotSessions / 8, 1) * 15
  const beginnerScore = Math.min(beginnerFriendly / 5, 1) * 10
  const socialProofScore = Math.min(withAttendees / 4, 1) * 5
  const qualityPenalty = Math.min(missingImage + likelyFallbackLocation, 5)

  return Math.max(
    0,
    Math.round(
      todayScore +
        tomorrowScore +
        weekScore +
        joinableScore +
        beginnerScore +
        socialProofScore -
        qualityPenalty
    )
  )
}

function readinessStatus(score: number): 'HEALTHY' | 'WATCH' | 'NEEDS_SUPPLY' {
  if (score >= 80) return 'HEALTHY'
  if (score >= 55) return 'WATCH'
  return 'NEEDS_SUPPLY'
}

async function getMarketDiscoveryStats(city: CityLocationConfig, now: Date, lastSevenDays: Date, nextSevenDays: Date) {
  const today = getLocalDateString(city.timezone)
  const tomorrow = getLocalDateString(city.timezone, 1)
  const todayRange = getUtcDateRangeForLocalDate(today, city.timezone)
  const tomorrowRange = getUtcDateRangeForLocalDate(tomorrow, city.timezone)
  const baseWhere = publicMapBaseWhere(city)
  const fallbackLocationWhere = {
    ...baseWhere,
    latitude: city.center.lat,
    longitude: city.center.lng,
  }

  const [
    visibleToday,
    mappedToday,
    nextSevenDaysVisible,
    weeklyCreated,
    weeklyVisible,
    freeUpcoming,
    paidUpcoming,
    missingImage,
    likelyFallbackLocation,
    nextSevenDaySessions,
  ] = await Promise.all([
    prisma.activity.count({
      where: {
        ...baseWhere,
        ...(todayRange ? { startTime: { gte: todayRange.start, lt: todayRange.end } } : {}),
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        ...(todayRange ? { startTime: { gte: todayRange.start, lt: todayRange.end } } : {}),
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        startTime: { gte: now, lt: nextSevenDays },
      },
    }),
    prisma.activity.count({
      where: {
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        createdAt: { gte: lastSevenDays },
        deletedAt: null,
        ...cityBoundsWhere(city),
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        createdAt: { gte: lastSevenDays },
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        activityMode: 'P2P_FREE',
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        activityMode: 'P2P_PAID',
      },
    }),
    prisma.activity.count({
      where: {
        ...baseWhere,
        OR: [{ imageUrl: null }, { imageUrl: '' }],
      },
    }),
    prisma.activity.count({ where: fallbackLocationWhere }),
    prisma.activity.findMany({
      where: {
        ...baseWhere,
        startTime: { gte: now, lt: nextSevenDays },
      },
      select: {
        id: true,
        title: true,
        activityMode: true,
        categorySlug: true,
        address: true,
        imageUrl: true,
        maxPeople: true,
        fitnessLevel: true,
        startTime: true,
        requiresApproval: true,
        communityId: true,
        community: { select: { id: true, name: true, slug: true } },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      take: 100,
    }),
  ])

  const tomorrowVisible = tomorrowRange
    ? nextSevenDaySessions.filter((session) => {
        const startTime = session.startTime?.getTime()
        return startTime !== undefined &&
          startTime >= tomorrowRange.start.getTime() &&
          startTime < tomorrowRange.end.getTime()
      }).length
    : 0
  const openSpotSessions = nextSevenDaySessions.filter((session) => {
    const attendeeCount = session.userActivities.length
    return typeof session.maxPeople !== 'number' || attendeeCount < session.maxPeople
  }).length
  const beginnerFriendly = nextSevenDaySessions.filter((session) =>
    !session.fitnessLevel || session.fitnessLevel === 'ALL'
  ).length
  const withAttendees = nextSevenDaySessions.filter((session) => session.userActivities.length > 0).length
  const withCommunity = nextSevenDaySessions.filter((session) => Boolean(session.communityId)).length
  const noCommunity = nextSevenDaySessions.length - withCommunity
  const requiresApprovalCount = nextSevenDaySessions.filter((session) => session.requiresApproval).length
  const lowFrictionSessions = nextSevenDaySessions.filter((session) => {
    const attendeeCount = session.userActivities.length
    const hasOpenSpot = typeof session.maxPeople !== 'number' || attendeeCount < session.maxPeople
    return hasOpenSpot && !session.requiresApproval && session.activityMode === 'P2P_FREE'
  }).length
  const activityMix = Object.values(
    nextSevenDaySessions.reduce<Record<string, { label: string; count: number }>>((acc, session) => {
      const label = session.categorySlug ?? 'other'
      acc[label] = acc[label] ?? { label, count: 0 }
      acc[label].count += 1
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count)
  const topCommunities = Object.values(
    nextSevenDaySessions.reduce<Record<string, { id: string; name: string; slug: string; count: number }>>((acc, session) => {
      if (!session.community) return acc
      acc[session.community.id] = acc[session.community.id] ?? {
        id: session.community.id,
        name: session.community.name,
        slug: session.community.slug,
        count: 0,
      }
      acc[session.community.id].count += 1
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count).slice(0, 5)
  const needsFirstAttendee = nextSevenDaySessions
    .filter((session) => session.userActivities.length === 0)
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      title: session.title,
      startTime: session.startTime,
      categorySlug: session.categorySlug,
    }))
  const readinessScore = scoreReadiness({
    visibleToday,
    tomorrowVisible,
    nextSevenDaysVisible,
    openSpotSessions,
    beginnerFriendly,
    withAttendees,
    missingImage,
    likelyFallbackLocation,
  })

  return {
    slug: city.slug,
    name: city.name,
    timezone: city.timezone,
    localToday: today,
    localTomorrow: tomorrow,
    visibleToday,
    mappedToday,
    tomorrowVisible,
    nextSevenDaysVisible,
    weeklyCreated,
    weeklyVisible,
    freeUpcoming,
    paidUpcoming,
    missingImage,
    likelyFallbackLocation,
    openSpotSessions,
    beginnerFriendly,
    withAttendees,
    withCommunity,
    noCommunity,
    requiresApprovalCount,
    lowFrictionSessions,
    activityMix,
    topCommunities,
    needsFirstAttendee,
    readinessScore,
    readinessStatus: readinessStatus(readinessScore),
    quietToday: visibleToday < 3,
  }
}

async function getDiscoveryFunnelStats(now: Date, lastSevenDays: Date, nextSevenDays: Date) {
  const relevantEvents = [
    'buddy_view_changed',
    'buddy_filter_used',
    'buddy_map_pin_clicked',
    'buddy_session_clicked',
    'official_join_clicked',
    'search_used',
  ]

  const [analyticsEvents, detailViews, recentJoins, upcomingSessions] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: lastSevenDays },
        event: { in: relevantEvents },
      },
      select: { event: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
    prisma.activityView.groupBy({
      by: ['activityId'],
      where: {
        viewedAt: { gte: lastSevenDays },
        activity: {
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          deletedAt: null,
        },
      },
      _count: { activityId: true },
    }),
    prisma.userActivity.groupBy({
      by: ['activityId'],
      where: {
        createdAt: { gte: lastSevenDays },
        status: { in: ['JOINED', 'COMPLETED'] },
        deletedAt: null,
        activity: {
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          deletedAt: null,
        },
      },
      _count: { activityId: true },
    }),
    prisma.activity.findMany({
      where: {
        ...publicMapBaseWhere(),
        startTime: { gte: now, lt: nextSevenDays },
      },
      select: {
        id: true,
        title: true,
        city: true,
        categorySlug: true,
        activityMode: true,
        price: true,
        startTime: true,
        maxPeople: true,
        community: { select: { name: true, slug: true } },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      take: 250,
    }),
  ])

  const sessionSignals = new Map<string, { pinClicks: number; sessionClicks: number; officialJoinClicks: number }>()
  let mapViews = 0
  let filterUses = 0
  let searches = 0
  let officialJoinClicks = 0

  analyticsEvents.forEach((event) => {
    const metadata = metadataRecord(event.metadata)
    if (event.event === 'buddy_view_changed') {
      const viewMode = metadataString(metadata, 'viewMode') ?? metadataString(metadata, 'view')
      if (viewMode === 'map') mapViews += 1
    }

    if (event.event === 'buddy_filter_used') filterUses += 1
    if (event.event === 'official_join_clicked') officialJoinClicks += 1
    if (event.event === 'search_used') searches += 1

    if (
      event.event !== 'buddy_map_pin_clicked' &&
      event.event !== 'buddy_session_clicked' &&
      event.event !== 'official_join_clicked'
    ) return
    const sessionId = metadataSessionId(metadata)
    if (!sessionId) return

    const signal = sessionSignals.get(sessionId) ?? {
      pinClicks: 0,
      sessionClicks: 0,
      officialJoinClicks: 0,
    }
    if (event.event === 'buddy_map_pin_clicked') signal.pinClicks += 1
    if (event.event === 'buddy_session_clicked') signal.sessionClicks += 1
    if (event.event === 'official_join_clicked') signal.officialJoinClicks += 1
    sessionSignals.set(sessionId, signal)
  })

  const detailViewsByActivity = new Map(detailViews.map((view) => [view.activityId, view._count.activityId]))
  const joinsByActivity = new Map(recentJoins.map((join) => [join.activityId, join._count.activityId]))
  const totalPinClicks = Array.from(sessionSignals.values()).reduce((sum, signal) => sum + signal.pinClicks, 0)
  const totalSessionClicks = Array.from(sessionSignals.values()).reduce((sum, signal) => sum + signal.sessionClicks, 0)
  const totalDetailViews = detailViews.reduce((sum, view) => sum + view._count.activityId, 0)
  const totalRecentJoins = recentJoins.reduce((sum, join) => sum + join._count.activityId, 0)

  const categoryRows = new Map<string, {
    label: string
    visibleSupply: number
    pinClicks: number
    sessionClicks: number
    officialJoinClicks: number
    detailViews: number
    joins: number
  }>()
  const cityRows = new Map<string, {
    city: string
    visibleSupply: number
    pinClicks: number
    sessionClicks: number
    officialJoinClicks: number
    detailViews: number
    joins: number
  }>()

  const demandGapSessions = upcomingSessions
    .map((session) => {
      const signal = sessionSignals.get(session.id) ?? {
        pinClicks: 0,
        sessionClicks: 0,
        officialJoinClicks: 0,
      }
      const detailViewCount = detailViewsByActivity.get(session.id) ?? 0
      const recentJoinCount = joinsByActivity.get(session.id) ?? 0
      const attendeeCount = session.userActivities.length
      const interest = signal.pinClicks + signal.sessionClicks + detailViewCount
      const city = session.city || 'Unknown'
      const category = session.categorySlug ?? 'other'

      const categoryRow = categoryRows.get(category) ?? {
        label: category,
        visibleSupply: 0,
        pinClicks: 0,
        sessionClicks: 0,
        officialJoinClicks: 0,
        detailViews: 0,
        joins: 0,
      }
      categoryRow.visibleSupply += 1
      categoryRow.pinClicks += signal.pinClicks
      categoryRow.sessionClicks += signal.sessionClicks
      categoryRow.officialJoinClicks += signal.officialJoinClicks
      categoryRow.detailViews += detailViewCount
      categoryRow.joins += recentJoinCount
      categoryRows.set(category, categoryRow)

      const cityRow = cityRows.get(city) ?? {
        city,
        visibleSupply: 0,
        pinClicks: 0,
        sessionClicks: 0,
        officialJoinClicks: 0,
        detailViews: 0,
        joins: 0,
      }
      cityRow.visibleSupply += 1
      cityRow.pinClicks += signal.pinClicks
      cityRow.sessionClicks += signal.sessionClicks
      cityRow.officialJoinClicks += signal.officialJoinClicks
      cityRow.detailViews += detailViewCount
      cityRow.joins += recentJoinCount
      cityRows.set(city, cityRow)

      const isStuck = interest >= 2 && recentJoinCount === 0
      const needsFirstAttendee = attendeeCount === 0 && interest > 0
      const lowConversion = interest >= 4 && percentage(recentJoinCount, interest) < 25

      return {
        id: session.id,
        title: session.title,
        city,
        categorySlug: category,
        startTime: session.startTime,
        activityMode: session.activityMode,
        price: session.price,
        communityName: session.community?.name ?? null,
        pinClicks: signal.pinClicks,
        sessionClicks: signal.sessionClicks,
        officialJoinClicks: signal.officialJoinClicks,
        detailViews: detailViewCount,
        recentJoins: recentJoinCount,
        attendeeCount,
        interest,
        conversionRate: percentage(recentJoinCount, interest),
        reason: needsFirstAttendee
          ? 'Interest, but no attendees yet'
          : isStuck
            ? 'Recent interest, no new joins'
            : lowConversion
              ? 'High interest, low conversion'
              : 'Healthy',
        href: `/activities/${session.id}`,
        shouldSurface: isStuck || needsFirstAttendee || lowConversion,
      }
    })
    .filter((session) => session.shouldSurface)
    .sort((a, b) => {
      if (b.interest !== a.interest) return b.interest - a.interest
      return (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
    })
    .slice(0, 8)
    .map(({ shouldSurface, ...session }) => session)

  const decorateConversionRow = <T extends {
    pinClicks: number
    sessionClicks: number
    officialJoinClicks: number
    detailViews: number
    joins: number
  }>(row: T) => ({
    ...row,
    interest: row.pinClicks + row.sessionClicks + row.detailViews,
    clickToJoinRate: percentage(row.joins, row.sessionClicks + row.detailViews),
    officialClickRate: percentage(row.officialJoinClicks, row.sessionClicks + row.detailViews),
  })

  return {
    windowDays: 7,
    mapViews,
    filterUses,
    searches,
    pinClicks: totalPinClicks,
    sessionClicks: totalSessionClicks,
    detailViews: totalDetailViews,
    officialJoinClicks,
    successfulJoins: totalRecentJoins,
    pinToDetailRate: percentage(totalDetailViews, totalPinClicks),
    detailToJoinRate: percentage(totalRecentJoins, totalDetailViews),
    clickToJoinRate: percentage(totalRecentJoins, totalSessionClicks + totalDetailViews),
    demandGapSessions,
    activityConversion: Array.from(categoryRows.values())
      .map(decorateConversionRow)
      .sort((a, b) => b.interest - a.interest)
      .slice(0, 8),
    cityConversion: Array.from(cityRows.values())
      .map(decorateConversionRow)
      .sort((a, b) => b.interest - a.interest),
  }
}

async function getCurationQueues(now: Date, nextSevenDays: Date) {
  const staleCutoff = new Date(now)
  staleCutoff.setDate(staleCutoff.getDate() - 30)

  const communities = await prisma.community.findMany({
    where: {
      isActive: true,
      moderationStatus: { in: ['LIVE', 'LIMITED'] },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      logoImage: true,
      coverImage: true,
      communityLink: true,
      websiteUrl: true,
      sourceUrl: true,
      lastVerifiedAt: true,
      verificationStatus: true,
      city: { select: { name: true } },
      activities: {
        where: {
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          status: 'PUBLISHED',
          moderationStatus: 'LIVE',
          startTime: { gte: now, lt: nextSevenDays },
          deletedAt: null,
        },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: 'asc' }, { name: 'asc' }],
    take: 500,
  })

  const formatQueueItem = (community: typeof communities[number], reason: string) => ({
    id: community.id,
    name: community.name,
    slug: community.slug,
    city: community.city?.name ?? 'Unknown',
    category: community.category,
    reason,
    lastVerifiedAt: community.lastVerifiedAt,
    href: `/admin/communities?focus=${community.id}`,
    publicHref: `/communities/${community.slug}`,
  })

  const missingOfficialLink = communities
    .filter((community) => !community.communityLink && !community.websiteUrl && !community.sourceUrl)
    .map((community) => formatQueueItem(community, 'No official join/source link'))

  const needsVerification = communities
    .filter((community) =>
      community.verificationStatus === 'NEEDS_VERIFICATION' ||
      !community.lastVerifiedAt ||
      community.lastVerifiedAt < staleCutoff
    )
    .map((community) => formatQueueItem(
      community,
      community.lastVerifiedAt
        ? `Last checked ${community.lastVerifiedAt.toISOString().slice(0, 10)}`
        : 'Never verified',
    ))

  const missingImage = communities
    .filter((community) => !community.logoImage || !community.coverImage)
    .map((community) => formatQueueItem(
      community,
      !community.logoImage && !community.coverImage
        ? 'Missing logo and cover'
        : !community.logoImage
          ? 'Missing logo'
          : 'Missing cover',
    ))

  const noUpcomingSessions = communities
    .filter((community) => community.activities.length === 0)
    .map((community) => formatQueueItem(community, 'No visible session in next 7 days'))
  const withOfficialLink = communities.filter((community) =>
    Boolean(community.communityLink || community.websiteUrl || community.sourceUrl)
  ).length
  const verifiedRecently = communities.filter((community) =>
    community.verificationStatus === 'VERIFIED' &&
    Boolean(community.lastVerifiedAt) &&
    community.lastVerifiedAt! >= staleCutoff
  ).length

  return {
    staleCutoff: staleCutoff.toISOString(),
    missingOfficialLink: missingOfficialLink.slice(0, 8),
    needsVerification: needsVerification.slice(0, 8),
    missingImage: missingImage.slice(0, 8),
    noUpcomingSessions: noUpcomingSessions.slice(0, 8),
    counts: {
      totalLiveCommunities: communities.length,
      withOfficialLink,
      verifiedRecently,
      officialLinkCoverage: percentage(withOfficialLink, communities.length),
      recentVerificationCoverage: percentage(verifiedRecently, communities.length),
      missingOfficialLink: missingOfficialLink.length,
      needsVerification: needsVerification.length,
      missingImage: missingImage.length,
      noUpcomingSessions: noUpcomingSessions.length,
    },
  }
}

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)
    const nextSevenDays = new Date(now)
    nextSevenDays.setDate(nextSevenDays.getDate() + 7)
    const lastSevenDays = new Date(now)
    lastSevenDays.setDate(lastSevenDays.getDate() - 7)
    const liveMapWhere = publicMapBaseWhere()

    const [
      totalUsers,
      usersOnboarded,
      p2pFreeSessions,
      p2pPaidSessions,
      marketplaceSessions,
      upcomingSessions,
      weeklyP2PSessions,
      todayMapSessions,
      nextSevenDayMapSessions,
      liveMapListings,
      pendingActivityApprovals,
      pendingCommunityNominations,
      pendingDiscoverySessions,
      totalAttendances,
      attendanceGroups,
      topHosts,
      discoveryMarkets,
      discoveryFunnel,
      curationQueues,
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
          startTime: { gte: now },
          deletedAt: null,
        },
      }),
      prisma.activity.count({
        where: {
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          createdAt: { gte: lastSevenDays },
          deletedAt: null,
        },
      }),
      prisma.activity.count({
        where: {
          ...liveMapWhere,
          startTime: { gte: startOfToday, lt: endOfToday },
        },
      }),
      prisma.activity.count({
        where: {
          ...liveMapWhere,
          startTime: { gte: now, lt: nextSevenDays },
        },
      }),
      prisma.activity.count({ where: liveMapWhere }),
      prisma.activity.count({
        where: {
          status: 'PENDING_APPROVAL',
          deletedAt: null,
        },
      }),
      prisma.communityNomination.count({ where: { status: 'PENDING' } }),
      prisma.discoveredSession.count({ where: { status: 'PENDING' } }),
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
      Promise.all(
        CITY_LOCATION_CONFIGS.map((city) =>
          getMarketDiscoveryStats(city, now, lastSevenDays, nextSevenDays)
        )
      ),
      getDiscoveryFunnelStats(now, lastSevenDays, nextSevenDays),
      getCurationQueues(now, nextSevenDays),
    ])

    const totalP2PSessions = p2pFreeSessions + p2pPaidSessions
    const weeklyVisibleP2PSessions = discoveryMarkets.reduce((sum, market) => sum + market.weeklyVisible, 0)
    const visibleTodayAcrossMarkets = discoveryMarkets.reduce((sum, market) => sum + market.visibleToday, 0)
    const mappedTodayAcrossMarkets = discoveryMarkets.reduce((sum, market) => sum + market.mappedToday, 0)
    const nextSevenDaysAcrossMarkets = discoveryMarkets.reduce((sum, market) => sum + market.nextSevenDaysVisible, 0)
    const missingImageAcrossMarkets = discoveryMarkets.reduce((sum, market) => sum + market.missingImage, 0)
    const likelyFallbackLocationAcrossMarkets = discoveryMarkets.reduce(
      (sum, market) => sum + market.likelyFallbackLocation,
      0
    )
    const quietMarkets = discoveryMarkets.filter((market) => market.quietToday).length
    const northStarScore = discoveryMarkets.length > 0
      ? Math.round(discoveryMarkets.reduce((sum, market) => sum + market.readinessScore, 0) / discoveryMarkets.length)
      : 0
    const northStarStatus = readinessStatus(northStarScore)
    const impactActions = [
      ...discoveryMarkets.flatMap((market) => {
        const actions: Array<{
          id: string
          market: string
          priority: number
          title: string
          detail: string
          href: string
        }> = []

        if (market.visibleToday < 3) {
          actions.push({
            id: `${market.slug}-today-supply`,
            market: market.name,
            priority: 100 - market.visibleToday * 10,
            title: `Add ${3 - market.visibleToday} more ${market.name} session${3 - market.visibleToday === 1 ? '' : 's'} today`,
            detail: `${market.visibleToday} visible today. Target is 3+ joinable plans.`,
            href: `/admin/communities?city=${market.slug}`,
          })
        }

        if (market.nextSevenDaysVisible < 10) {
          actions.push({
            id: `${market.slug}-week-supply`,
            market: market.name,
            priority: 80 - market.nextSevenDaysVisible,
            title: `Build ${market.name} next-7-day supply`,
            detail: `${market.nextSevenDaysVisible} visible. Target is 10+ upcoming plans.`,
            href: `/admin/discovery`,
          })
        }

        if (market.withAttendees < Math.min(4, market.nextSevenDaysVisible)) {
          actions.push({
            id: `${market.slug}-social-proof`,
            market: market.name,
            priority: 64 - market.withAttendees,
            title: `Seed social proof in ${market.name}`,
            detail: `${market.withAttendees} upcoming sessions have attendees. Prioritize first joins on empty plans.`,
            href: `/buddy?city=${market.slug}&view=map`,
          })
        }

        if (market.noCommunity > 0) {
          actions.push({
            id: `${market.slug}-community-links`,
            market: market.name,
            priority: 52,
            title: `Attach sessions to communities in ${market.name}`,
            detail: `${market.noCommunity} upcoming sessions are not tied to a community page.`,
            href: `/admin/communities`,
          })
        }

        if (market.missingImage > 0 || market.likelyFallbackLocation > 0) {
          actions.push({
            id: `${market.slug}-quality`,
            market: market.name,
            priority: 48,
            title: `Clean listing quality in ${market.name}`,
            detail: `${market.missingImage} missing images and ${market.likelyFallbackLocation} likely fallback locations.`,
            href: `/admin/sessions`,
          })
        }

        return actions
      }),
      ...(pendingActivityApprovals > 0
        ? [{
            id: 'pending-activity-approvals',
            market: 'All markets',
            priority: 92,
            title: 'Clear session approval queue',
            detail: `${pendingActivityApprovals} submitted sessions are waiting for review.`,
            href: '/admin/activities',
          }]
        : []),
      ...(pendingCommunityNominations > 0
        ? [{
            id: 'pending-community-nominations',
            market: 'All markets',
            priority: 88,
            title: 'Clear community nominations',
            detail: `${pendingCommunityNominations} communities are waiting for moderation.`,
            href: '/admin/nominations',
          }]
        : []),
      ...(pendingDiscoverySessions > 0
        ? [{
            id: 'pending-discovery-sessions',
            market: 'All markets',
            priority: 86,
            title: 'Approve useful discovered sessions',
            detail: `${pendingDiscoverySessions} discovered sessions can become map supply.`,
            href: '/admin/discovery',
          }]
        : []),
      ...(curationQueues.counts.missingOfficialLink > 0
        ? [{
            id: 'missing-official-links',
            market: 'All markets',
            priority: 84,
            title: 'Add official join links',
            detail: `${curationQueues.counts.missingOfficialLink} communities are missing an official/source link.`,
            href: '/admin/communities',
          }]
        : []),
      ...(curationQueues.counts.needsVerification > 0
        ? [{
            id: 'stale-community-verification',
            market: 'All markets',
            priority: 72,
            title: 'Refresh stale community checks',
            detail: `${curationQueues.counts.needsVerification} communities need a fresh verification pass.`,
            href: '/admin/communities',
          }]
        : []),
    ].sort((a, b) => b.priority - a.priority).slice(0, 8)

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
      weeklyP2PSessions,
      weeklyVisibleP2PSessions,
      todayMapSessions,
      visibleTodayAcrossMarkets,
      mappedTodayAcrossMarkets,
      nextSevenDayMapSessions,
      nextSevenDaysAcrossMarkets,
      liveMapListings,
      missingImageAcrossMarkets,
      likelyFallbackLocationAcrossMarkets,
      curationQueues,
      quietMarkets,
      northStarScore,
      northStarStatus,
      impactActions,
      pendingActivityApprovals,
      pendingCommunityNominations,
      pendingDiscoverySessions,
      totalAttendances,
      avgAttendeesPerSession,
      discoveryMarkets,
      discoveryFunnel,
      topHosts,
    })
  } catch (error) {
    console.error('P2P stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
