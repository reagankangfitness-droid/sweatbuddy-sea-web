import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_CITY_LOCATION_CONFIG,
  findCityLocationConfig,
  getCityLocationConfig,
  getNearestCityLocationConfig,
  getUtcDateRangeForLocalDate,
  isPointInsideCityDetectionRadius,
} from '@/lib/location-config'
import {
  getCategoryFallbackImage,
  resolveSessionMediaMap,
  type ResolvedSessionMedia,
} from '@/lib/session-media'

export const dynamic = 'force-dynamic'

interface SessionCursor {
  isFeatured: boolean
  startTime: string
  id: string
}

function encodeSessionCursor(session: {
  id: string
  isFeatured: boolean
  startTime: Date | null
}): string | null {
  if (!session.startTime) return null
  return Buffer.from(
    JSON.stringify({
      isFeatured: session.isFeatured,
      startTime: session.startTime.toISOString(),
      id: session.id,
    }),
  ).toString('base64url')
}

function decodeSessionCursor(cursor: string): SessionCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<SessionCursor>
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.startTime === 'string' &&
      typeof parsed.isFeatured === 'boolean' &&
      !Number.isNaN(new Date(parsed.startTime).getTime())
    ) {
      return {
        id: parsed.id,
        startTime: parsed.startTime,
        isFeatured: parsed.isFeatured,
      }
    }
  } catch {
    return null
  }

  return null
}

export async function GET(request: Request) {
  try {
    // Auth is optional — unauthenticated users can browse sessions
    let dbUser: { id: string; blocksMade: { blockedUserId: string }[] } | null = null
    const cookieHeader = request.headers.get('cookie') ?? ''
    const mightHaveSession = /(?:^|;\s*)(?:__session|__client_uat|__clerk)/.test(cookieHeader)

    if (mightHaveSession) {
      const { userId } = await auth()
      if (userId) {
        const clerkUser = await currentUser()
        const email = clerkUser?.primaryEmailAddress?.emailAddress
        if (email) {
          dbUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, blocksMade: { select: { blockedUserId: true } } },
          })
        }
      }
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') ?? 'happening'
    const activityType = searchParams.get('type') ?? ''
    const fitnessLevel = searchParams.get('fitnessLevel') ?? ''
    const pricingFilter = searchParams.get('pricing') ?? '' // 'free' | 'paid' | ''
    const cursor = searchParams.get('cursor') ?? undefined
    const PAGE_SIZE = 20

    const blockedUserIds = dbUser?.blocksMade.map((b) => b.blockedUserId) ?? []
    const verifiedFilter = searchParams.get('verified') ?? ''

    if (tab === 'mine') {
      if (!dbUser) return NextResponse.json({ hosting: [], attending: [] })
      // Sessions the user is hosting OR attending
      const [hosting, attending] = await Promise.all([
        prisma.activity.findMany({
          where: {
            userId: dbUser.id,
            activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                slug: true,
                sessionsHostedCount: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                logoImage: true,
                coverImage: true,
                slug: true,
                communityLink: true,
                websiteUrl: true,
                sourceUrl: true,
                joinPlatform: true,
                lastVerifiedAt: true,
              },
            },
            userActivities: {
              where: { status: { in: ['JOINED', 'COMPLETED'] } },
              include: { user: { select: { id: true, name: true, imageUrl: true, slug: true } } },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        }),
        prisma.userActivity.findMany({
          where: {
            userId: dbUser.id,
            status: { in: ['JOINED', 'COMPLETED'] },
            activity: {
              activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
              userId: { not: dbUser.id },
              deletedAt: null,
            },
          },
          include: {
            activity: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    slug: true,
                    sessionsHostedCount: true,
                  },
                },
                userActivities: {
                  where: { status: { in: ['JOINED', 'COMPLETED'] } },
                  include: {
                    user: { select: { id: true, name: true, imageUrl: true, slug: true } },
                  },
                },
                community: {
                  select: {
                    id: true,
                    name: true,
                    logoImage: true,
                    coverImage: true,
                    slug: true,
                    communityLink: true,
                    websiteUrl: true,
                    sourceUrl: true,
                    joinPlatform: true,
                    lastVerifiedAt: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ])

      const hostingMedia = await resolveSessionMediaMap(hosting)
      const attendingActivities = attending.map((ua) => ua.activity)
      const attendingMedia = await resolveSessionMediaMap(attendingActivities)

      return NextResponse.json({
        hosting: hosting.map((a) => formatSession(a, undefined, hostingMedia.get(a.id))),
        attending: attending.map((ua) =>
          formatSession(ua.activity, ua.status as string, attendingMedia.get(ua.activity.id)),
        ),
      })
    }

    // Tab = 'happening' — upcoming P2P sessions
    const where: Record<string, unknown> = {
      activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
      status: 'PUBLISHED',
      moderationStatus: 'LIVE',
      startTime: { gt: new Date() },
      deletedAt: null,
      ...(blockedUserIds.length > 0 ? { userId: { notIn: blockedUserIds } } : {}),
    }

    // Location-based filtering — radius bounding box scoped to the active city.
    const requestedCitySlug = searchParams.get('city')
    const knownRequestedCity = findCityLocationConfig(requestedCitySlug)
    const isNearbyRequest = searchParams.get('location') === 'nearby'
    const isExplicitCityRequest = Boolean(knownRequestedCity && !isNearbyRequest)
    const requestedCity = knownRequestedCity ?? getCityLocationConfig(requestedCitySlug)
    const parsedLat = parseFloat(searchParams.get('lat') ?? '')
    const parsedLng = parseFloat(searchParams.get('lng') ?? '')
    const hasValidCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng)
    const providedPoint = { lat: parsedLat, lng: parsedLng }
    const activeCity = isExplicitCityRequest
      ? requestedCity
      : hasValidCoordinates
        ? getNearestCityLocationConfig(parsedLat, parsedLng)
        : requestedCity
    const scopedPoint = isExplicitCityRequest
      ? hasValidCoordinates && isPointInsideCityDetectionRadius(activeCity, providedPoint)
        ? providedPoint
        : activeCity.center
      : hasValidCoordinates
        ? providedPoint
        : activeCity.center
    const timezone =
      searchParams.get('timezone') || activeCity.timezone || DEFAULT_CITY_LOCATION_CONFIG.timezone

    const radiusKm = parseDiscoveryRadiusKm(searchParams.get('radius'), activeCity.defaultRadius)
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos(scopedPoint.lat * (Math.PI / 180)))
    where.latitude = { gte: scopedPoint.lat - latDelta, lte: scopedPoint.lat + latDelta }
    where.longitude = { gte: scopedPoint.lng - lngDelta, lte: scopedPoint.lng + lngDelta }

    // Date filtering — show sessions on a specific date
    const dateFilter = searchParams.get('date')
    if (dateFilter) {
      const dateRange = getUtcDateRangeForLocalDate(dateFilter, timezone)
      if (dateRange) {
        where.startTime = { gte: dateRange.start, lt: dateRange.end }
      }
    }

    if (activityType) where.categorySlug = activityType
    if (fitnessLevel) where.fitnessLevel = fitnessLevel
    if (pricingFilter === 'free') where.activityMode = 'P2P_FREE'
    if (pricingFilter === 'paid') where.activityMode = 'P2P_PAID'
    if (verifiedFilter === 'true') {
      where.user = { isCoach: true, coachVerificationStatus: 'VERIFIED' }
    }
    if (cursor) {
      const decodedCursor = decodeSessionCursor(cursor)
      if (decodedCursor) {
        const cursorStartTime = new Date(decodedCursor.startTime)
        const sameFeaturedAfterCursor = {
          isFeatured: decodedCursor.isFeatured,
          OR: [
            { startTime: { gt: cursorStartTime } },
            { startTime: cursorStartTime, id: { gt: decodedCursor.id } },
          ],
        }

        where.AND = [
          {
            OR: decodedCursor.isFeatured
              ? [sameFeaturedAfterCursor, { isFeatured: false }]
              : [sameFeaturedAfterCursor],
          },
        ]
      } else {
        where.id = { lt: cursor }
      }
    }

    const sessions = await prisma.activity.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        activityMode: true,
        categorySlug: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        price: true,
        currency: true,
        status: true,
        fitnessLevel: true,
        whatToBring: true,
        requiresApproval: true,
        imageUrl: true,
        placeId: true,
        isFeatured: true,
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true,
            sessionsHostedCount: true,
            fitnessLevel: true,
            isCoach: true,
            coachVerificationStatus: true,
          },
        },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          orderBy: { createdAt: 'asc' },
          take: 8,
          select: {
            goingSolo: true,
            user: { select: { id: true, name: true, imageUrl: true, slug: true } },
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            logoImage: true,
            coverImage: true,
            slug: true,
            communityLink: true,
            websiteUrl: true,
            sourceUrl: true,
            joinPlatform: true,
            lastVerifiedAt: true,
          },
        },
        ratingSummary: {
          select: { averageRating: true, totalReviews: true },
        },
        _count: {
          select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { startTime: 'asc' }, { id: 'asc' }],
      take: PAGE_SIZE + 1,
    })

    const hasMore = sessions.length > PAGE_SIZE
    const items = hasMore ? sessions.slice(0, PAGE_SIZE) : sessions
    const nextCursor = hasMore ? encodeSessionCursor(items[items.length - 1]) : null
    const mediaBySessionId = await resolveSessionMediaMap(items)

    return NextResponse.json({
      sessions: items.map((a) => formatSession(a, undefined, mediaBySessionId.get(a.id))),
      nextCursor,
      currentUserId: dbUser?.id ?? null,
    }, {
      headers: dbUser
        ? { 'Cache-Control': 'private, no-store' }
        : {
            'Cache-Control': 'public, max-age=0, s-maxage=45, stale-while-revalidate=300',
            'CDN-Cache-Control': 'public, s-maxage=45, stale-while-revalidate=300',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=45, stale-while-revalidate=300',
          },
    })
  } catch (error) {
    if (isRecoverableDiscoveryDbError(error)) {
      return NextResponse.json({
        sessions: [],
        nextCursor: null,
        currentUserId: null,
      })
    }

    console.error('[buddy/sessions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function isRecoverableDiscoveryDbError(error: unknown) {
  return error instanceof Error && (
    error.name === 'PrismaClientInitializationError' ||
    error.message.includes('exceeded the data transfer quota')
  )
}

function parseDiscoveryRadiusKm(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  const safeFallback = Number.isFinite(fallback) ? fallback : DEFAULT_CITY_LOCATION_CONFIG.defaultRadius
  const radius = Number.isFinite(parsed) ? parsed : safeFallback

  return Math.min(80, Math.max(2, radius))
}

interface SessionActivity {
  id: string
  title: string
  description: string | null
  activityMode: string
  categorySlug: string | null
  city: string
  address: string | null
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  price: number
  currency: string
  status: string
  fitnessLevel: string | null
  whatToBring: string | null
  requiresApproval: boolean
  imageUrl: string | null
  placeId?: string | null
  isFeatured: boolean
  user?: unknown
  community?: unknown
  ratingSummary?: {
    averageRating: unknown
    totalReviews: number
  } | null
  _count?: {
    userActivities: number
  }
  userActivities: Array<{
    goingSolo?: boolean
    user: unknown
  }>
}

function formatSession(
  activity: SessionActivity,
  userStatus?: string,
  resolvedMedia?: ResolvedSessionMedia,
) {
  const attendees = activity.userActivities ?? []
  const attendeeCount = activity._count?.userActivities ?? attendees.length
  const isFull = typeof activity.maxPeople === 'number' && attendeeCount >= activity.maxPeople
  const community = normalizeCommunity(activity.community)
  const media = resolvedMedia ?? {
    resolvedImageUrl: activity.imageUrl || getCategoryFallbackImage(activity.categorySlug),
    imageSourceType: activity.imageUrl ? 'SESSION_UPLOAD' : 'CATEGORY_FALLBACK',
    imageSourceLabel: activity.imageUrl ? 'Session photo' : 'Activity image',
    imageAttributionName: null,
    imageAttributionUrl: null,
    imageSourceUrl: null,
    matchedFitnessPlaceId: null,
  }

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    activityMode: activity.activityMode,
    categorySlug: activity.categorySlug,
    city: activity.city,
    address: activity.address,
    latitude: activity.latitude,
    longitude: activity.longitude,
    startTime: activity.startTime,
    endTime: activity.endTime,
    maxPeople: activity.maxPeople,
    price: activity.price,
    currency: activity.currency,
    status: activity.status,
    fitnessLevel: activity.fitnessLevel,
    whatToBring: activity.whatToBring,
    requiresApproval: activity.requiresApproval,
    imageUrl: activity.imageUrl,
    resolvedImageUrl: media.resolvedImageUrl,
    imageSourceType: media.imageSourceType,
    imageSourceLabel: media.imageSourceLabel,
    imageAttributionName: media.imageAttributionName,
    imageAttributionUrl: media.imageAttributionUrl,
    imageSourceUrl: media.imageSourceUrl,
    matchedFitnessPlaceId: media.matchedFitnessPlaceId,
    host: activity.user ?? null,
    community,
    officialJoinUrl: community?.communityLink ?? community?.websiteUrl ?? community?.sourceUrl ?? null,
    officialJoinPlatform: community?.joinPlatform ?? null,
    lastVerifiedAt: community?.lastVerifiedAt ?? null,
    attendees: attendees.map((ua) => ({
      ...(typeof ua.user === 'object' && ua.user ? ua.user : {}),
      goingSolo: ua.goingSolo === true,
    })),
    goingSoloCount: attendees.filter((ua) => ua.goingSolo === true).length,
    attendeeCount,
    isFull,
    isFeatured: activity.isFeatured ?? false,
    userStatus: userStatus ?? null,
    avgRating: activity.ratingSummary ? Number(activity.ratingSummary.averageRating) : null,
    reviewCount: activity.ratingSummary?.totalReviews ?? 0,
  }
}

function normalizeCommunity(community: unknown) {
  if (!community || typeof community !== 'object') return null
  const value = community as {
    id?: unknown
    name?: unknown
    logoImage?: unknown
    coverImage?: unknown
    slug?: unknown
    communityLink?: unknown
    websiteUrl?: unknown
    sourceUrl?: unknown
    joinPlatform?: unknown
    lastVerifiedAt?: unknown
  }

  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.slug !== 'string') {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    logoImage: typeof value.logoImage === 'string' ? value.logoImage : null,
    coverImage: typeof value.coverImage === 'string' ? value.coverImage : null,
    slug: value.slug,
    communityLink: typeof value.communityLink === 'string' ? value.communityLink : null,
    websiteUrl: typeof value.websiteUrl === 'string' ? value.websiteUrl : null,
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : null,
    joinPlatform: typeof value.joinPlatform === 'string' ? value.joinPlatform : null,
    lastVerifiedAt: value.lastVerifiedAt instanceof Date ? value.lastVerifiedAt : null,
  }
}
