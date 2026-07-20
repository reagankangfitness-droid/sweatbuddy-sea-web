import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_CITY_LOCATION_CONFIG,
  findCityLocationConfig,
  getCityLocationConfig,
  getNearestCityLocationConfig,
  isPointInsideCityDetectionRadius,
} from '@/lib/location-config'
import { getListingPositioning } from '@/lib/listing-positioning'

export const dynamic = 'force-dynamic'

const TYPE_TO_PLACE_FILTER: Record<string, Prisma.FitnessPlaceWhereInput> = {
  running: {
    OR: [
      { activities: { has: 'running' } },
      { activities: { has: 'run' } },
      { placeType: 'OUTDOOR_FITNESS' },
      { communityTypes: { has: 'run club' } },
    ],
  },
  yoga: {
    OR: [
      { activities: { has: 'yoga' } },
      { placeType: 'STUDIO' },
      { placeTypes: { has: 'yoga_studio' } },
    ],
  },
  strength: {
    OR: [
      { activities: { has: 'strength' } },
      { activities: { has: 'gym' } },
      { placeType: 'GYM' },
      { placeTypes: { has: 'gym' } },
    ],
  },
  gym: {
    OR: [{ placeType: 'GYM' }, { activities: { has: 'gym' } }, { placeTypes: { has: 'gym' } }],
  },
  pilates: {
    OR: [
      { activities: { has: 'pilates' } },
      { placeTypes: { has: 'pilates_studio' } },
      { name: { contains: 'pilates', mode: 'insensitive' } },
    ],
  },
  pickleball: {
    OR: [
      { activities: { has: 'pickleball' } },
      { placeType: 'SPORTS_FACILITY' },
      { name: { contains: 'pickleball', mode: 'insensitive' } },
    ],
  },
  cycling: {
    OR: [
      { activities: { has: 'cycling' } },
      { activities: { has: 'cycle' } },
      { name: { contains: 'cycling', mode: 'insensitive' } },
    ],
  },
  recovery: {
    OR: [
      { activities: { has: 'recovery' } },
      { activities: { has: 'sauna' } },
      { placeType: 'WELLNESS' },
    ],
  },
  hiking: {
    OR: [{ activities: { has: 'hiking' } }, { placeType: 'OUTDOOR_FITNESS' }],
  },
  hiit: {
    OR: [
      { activities: { has: 'hiit' } },
      { activities: { has: 'bootcamp' } },
      { placeTypes: { has: 'gym' } },
    ],
  },
  bootcamp: {
    OR: [{ activities: { has: 'bootcamp' } }, { placeType: 'OUTDOOR_FITNESS' }],
  },
  social: {
    OR: [
      { communityTypes: { isEmpty: false } },
      { socialScore: { gte: 50 } },
      { vibeTags: { has: 'social' } },
    ],
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedCitySlug = searchParams.get('city')
    const knownRequestedCity = findCityLocationConfig(requestedCitySlug)
    const isNearbyRequest = searchParams.get('location') === 'nearby'
    const isExplicitCityRequest = Boolean(knownRequestedCity && !isNearbyRequest)
    const requestedCity = knownRequestedCity ?? getCityLocationConfig(requestedCitySlug)
    const parsedLat = parseFloat(searchParams.get('lat') ?? '')
    const parsedLng = parseFloat(searchParams.get('lng') ?? '')
    const hasValidCoordinates = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)
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
    const radiusKm = parseDiscoveryRadiusKm(searchParams.get('radius'), activeCity.defaultRadius)
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos(scopedPoint.lat * (Math.PI / 180)))
    const activityType = searchParams.get('type') ?? ''
    const typeFilter = TYPE_TO_PLACE_FILTER[activityType] ?? null

    const where: Prisma.FitnessPlaceWhereInput = {
      isActive: true,
      moderationStatus: 'LIVE',
      latitude: { gte: scopedPoint.lat - latDelta, lte: scopedPoint.lat + latDelta },
      longitude: { gte: scopedPoint.lng - lngDelta, lte: scopedPoint.lng + lngDelta },
      ...(isExplicitCityRequest ? { city: { slug: activeCity.slug } } : {}),
      ...(typeFilter ?? {}),
    }

    const places = await prisma.fitnessPlace.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        placeType: true,
        area: true,
        address: true,
        latitude: true,
        longitude: true,
        coverImage: true,
        photos: true,
        activities: true,
        vibeTags: true,
        communityTypes: true,
        bestFor: true,
        dropInFriendly: true,
        beginnerFriendly: true,
        socialScore: true,
        bookingUrl: true,
        websiteUrl: true,
        sourceUrl: true,
        averageRating: true,
        googleRating: true,
        googleReviewCount: true,
        googleMapsUrl: true,
        trustScore: true,
        photoQualityScore: true,
        reviewSentimentScore: true,
        isFeatured: true,
        lastVerifiedAt: true,
        city: { select: { name: true, slug: true } },
        _count: { select: { communityLinks: true, reviews: true } },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { trustScore: 'desc' },
        { googleReviewCount: 'desc' },
        { name: 'asc' },
      ],
      take: 500,
    })

    const mediaByPlaceId = await getLiveMediaByPlaceId(places.map((place) => place.id))
    const formattedPlaces = places.map((place) => {
      const media = mediaByPlaceId.get(place.id) ?? []
      const photos = [
        ...media.map((asset) => asset.thumbnailUrl || asset.imageUrl),
        ...place.photos,
        place.coverImage,
      ].filter(Boolean) as string[]
      const positioning = getListingPositioning({
        ...place,
        averageRating: Number(place.averageRating),
        googleRating: place.googleRating === null ? null : Number(place.googleRating),
        communityLinkCount: place._count.communityLinks,
      })

      return {
        id: place.id,
        slug: place.slug,
        name: place.name,
        description: place.description,
        placeType: place.placeType,
        area: place.area,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        imageUrl: photos[0] ?? null,
        photos: Array.from(new Set(photos)).slice(0, 4),
        activities: place.activities,
        vibeTags: place.vibeTags,
        communityTypes: place.communityTypes,
        bestFor: place.bestFor,
        dropInFriendly: place.dropInFriendly,
        beginnerFriendly: place.beginnerFriendly,
        socialScore: place.socialScore,
        googleRating: place.googleRating === null ? null : Number(place.googleRating),
        googleReviewCount: place.googleReviewCount,
        googleMapsUrl: place.googleMapsUrl,
        trustScore: place.trustScore,
        photoQualityScore: place.photoQualityScore,
        reviewSentimentScore: place.reviewSentimentScore,
        isFeatured: place.isFeatured,
        lastVerifiedAt: place.lastVerifiedAt?.toISOString() ?? null,
        city: place.city,
        communityLinkCount: place._count.communityLinks,
        reviewCount: place._count.reviews,
        listingIntent: positioning.intent,
        joinPath: positioning.joinPath,
        socialSignal: positioning.socialSignal,
        publicPriority: positioning.publicPriority,
        socialUsefulnessScore: positioning.score,
        positioningBadges: positioning.badges,
      }
    }).sort((a, b) => {
      if (a.socialUsefulnessScore !== b.socialUsefulnessScore) {
        return b.socialUsefulnessScore - a.socialUsefulnessScore
      }
      const aReviewScore = a.reviewCount + a.googleReviewCount
      const bReviewScore = b.reviewCount + b.googleReviewCount
      if (aReviewScore !== bReviewScore) return bReviewScore - aReviewScore
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          places: formattedPlaces,
          total: formattedPlaces.length,
          city: activeCity.slug || DEFAULT_CITY_LOCATION_CONFIG.slug,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    if (isRecoverableDiscoveryDbError(error)) {
      return NextResponse.json({
        success: true,
        data: {
          places: [],
          total: 0,
          city: DEFAULT_CITY_LOCATION_CONFIG.slug,
        },
      })
    }

    console.error('[map/places] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch map places' }, { status: 500 })
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

async function getLiveMediaByPlaceId(placeIds: string[]) {
  const byPlaceId = new Map<string, Array<{ imageUrl: string; thumbnailUrl: string | null }>>()
  if (placeIds.length === 0) return byPlaceId

  const assets = await prisma.mediaAsset.findMany({
    where: {
      entityType: 'FITNESS_PLACE',
      entityId: { in: placeIds },
      status: 'LIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      entityId: true,
      imageUrl: true,
      thumbnailUrl: true,
    },
    orderBy: [{ priority: 'desc' }, { capturedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  for (const asset of assets) {
    const current = byPlaceId.get(asset.entityId) ?? []
    if (current.length < 4) {
      current.push({ imageUrl: asset.imageUrl, thumbnailUrl: asset.thumbnailUrl })
      byPlaceId.set(asset.entityId, current)
    }
  }

  return byPlaceId
}
