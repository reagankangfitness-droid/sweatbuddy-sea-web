import type { MediaAsset, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const SESSION_LISTING_IMAGES: Record<string, string> = {
  running: '/banner/running.jpg',
  run: '/banner/running.jpg',
  yoga: '/images/hero-bg.jpg',
  hiit: '/images/connect-people.webp',
  bootcamp: '/banner/athletics.jpg',
  cycling: '/images/community-bonds.jpg',
  swimming: '/images/hero/ice-bath.webp',
  volleyball: '/images/community-bonds.jpg',
  basketball: '/banner/athletics.jpg',
  pilates: '/images/hero/meditation.png',
  hiking: '/images/cities/singapore.jpg',
  strength: '/banner/athletics.jpg',
  gym: '/banner/athletics.jpg',
  cold_plunge: '/banner/ice-bath.webp',
  recovery: '/banner/ice-bath.webp',
  dance_fitness: '/images/connect-people.webp',
  badminton: '/images/community-bonds.jpg',
  padel: '/images/community-bonds.jpg',
  combat_fitness: '/banner/athletics.jpg',
  boxing: '/banner/athletics.jpg',
  muay_thai: '/banner/athletics.jpg',
  pickleball: '/images/community-bonds.jpg',
  social: '/images/hosts/run-club-group.jpg',
  other: '/images/hero/run-club.jpg',
}

export interface SessionMediaInput {
  id: string
  imageUrl: string | null
  categorySlug: string | null
  city: string | null
  address: string | null
  placeId?: string | null
  latitude?: number | null
  longitude?: number | null
  community?: {
    coverImage?: string | null
    logoImage?: string | null
  } | null
}

export interface ResolvedSessionMedia {
  resolvedImageUrl: string
  imageSourceType:
    | 'SESSION_UPLOAD'
    | 'ACTIVITY_MEDIA'
    | 'GOOGLE_PLACE_PHOTO'
    | 'PLACE_MEDIA'
    | 'PLACE_COVER'
    | 'COMMUNITY_COVER'
    | 'COMMUNITY_LOGO'
    | 'CATEGORY_FALLBACK'
  imageSourceLabel: string
  imageAttributionName: string | null
  imageAttributionUrl: string | null
  imageSourceUrl: string | null
  matchedFitnessPlaceId: string | null
}

type FitnessPlaceMedia = Prisma.FitnessPlaceGetPayload<{
  select: {
    id: true
    name: true
    address: true
    area: true
    latitude: true
    longitude: true
    googlePlaceId: true
    coverImage: true
    photos: true
    sourceUrl: true
  }
}>

let hasMediaAssetsTable: boolean | null = null

export function getCategoryFallbackImage(categorySlug: string | null | undefined) {
  const category = (categorySlug ?? 'other').toLowerCase()
  return SESSION_LISTING_IMAGES[category] || SESSION_LISTING_IMAGES.other
}

export async function resolveSessionMediaMap<T extends SessionMediaInput>(
  sessions: T[],
): Promise<Map<string, ResolvedSessionMedia>> {
  const results = new Map<string, ResolvedSessionMedia>()
  if (sessions.length === 0) return results

  const activityMediaByEntityId = await getLiveMediaAssetsByEntity('ACTIVITY', sessions.map((s) => s.id))
  const places = await getCandidateFitnessPlaces()
  const placeBySessionId = matchPlacesForSessions(sessions, places)
  const placeMediaByEntityId = await getLiveMediaAssetsByEntity(
    'FITNESS_PLACE',
    [...new Set([...placeBySessionId.values()].map((place) => place.id))],
  )

  for (const session of sessions) {
    results.set(
      session.id,
      resolveSessionMedia(session, {
        activityMedia: activityMediaByEntityId.get(session.id),
        fitnessPlace: placeBySessionId.get(session.id),
        placeMedia: placeBySessionId.get(session.id)
          ? placeMediaByEntityId.get(placeBySessionId.get(session.id)!.id)
          : undefined,
      }),
    )
  }

  return results
}

export function resolveSessionMedia(
  session: SessionMediaInput,
  context: {
    activityMedia?: MediaAsset
    fitnessPlace?: FitnessPlaceMedia
    placeMedia?: MediaAsset
  } = {},
): ResolvedSessionMedia {
  if (session.imageUrl && !isDefaultLocalImage(session.imageUrl)) {
    return {
      resolvedImageUrl: session.imageUrl,
      imageSourceType: 'SESSION_UPLOAD',
      imageSourceLabel: 'Session photo',
      imageAttributionName: null,
      imageAttributionUrl: null,
      imageSourceUrl: null,
      matchedFitnessPlaceId: context.fitnessPlace?.id ?? null,
    }
  }

  if (context.activityMedia) {
    return fromMediaAsset(context.activityMedia, 'ACTIVITY_MEDIA', 'Updated photo', context.fitnessPlace?.id ?? null)
  }

  if (context.placeMedia) {
    return fromMediaAsset(
      context.placeMedia,
      context.placeMedia.sourceType === 'GOOGLE_PLACE' ? 'GOOGLE_PLACE_PHOTO' : 'PLACE_MEDIA',
      context.placeMedia.sourceType === 'GOOGLE_PLACE' ? 'Google venue photo' : 'Venue photo',
      context.fitnessPlace?.id ?? null,
    )
  }

  const placePhoto = context.fitnessPlace?.photos.find(Boolean) || context.fitnessPlace?.coverImage
  if (placePhoto) {
    return {
      resolvedImageUrl: placePhoto,
      imageSourceType: 'PLACE_COVER',
      imageSourceLabel: 'Venue photo',
      imageAttributionName: null,
      imageAttributionUrl: null,
      imageSourceUrl: context.fitnessPlace?.sourceUrl ?? null,
      matchedFitnessPlaceId: context.fitnessPlace?.id ?? null,
    }
  }

  if (session.community?.coverImage) {
    return {
      resolvedImageUrl: session.community.coverImage,
      imageSourceType: 'COMMUNITY_COVER',
      imageSourceLabel: 'Community photo',
      imageAttributionName: null,
      imageAttributionUrl: null,
      imageSourceUrl: null,
      matchedFitnessPlaceId: context.fitnessPlace?.id ?? null,
    }
  }

  if (session.community?.logoImage) {
    return {
      resolvedImageUrl: session.community.logoImage,
      imageSourceType: 'COMMUNITY_LOGO',
      imageSourceLabel: 'Community photo',
      imageAttributionName: null,
      imageAttributionUrl: null,
      imageSourceUrl: null,
      matchedFitnessPlaceId: context.fitnessPlace?.id ?? null,
    }
  }

  return {
    resolvedImageUrl: session.imageUrl || getCategoryFallbackImage(session.categorySlug),
    imageSourceType: 'CATEGORY_FALLBACK',
    imageSourceLabel: 'Activity image',
    imageAttributionName: null,
    imageAttributionUrl: null,
    imageSourceUrl: null,
    matchedFitnessPlaceId: context.fitnessPlace?.id ?? null,
  }
}

function isDefaultLocalImage(imageUrl: string) {
  return imageUrl.startsWith('/banner/') || imageUrl.startsWith('/images/')
}

function fromMediaAsset(
  media: MediaAsset,
  sourceType: ResolvedSessionMedia['imageSourceType'],
  label: string,
  matchedFitnessPlaceId: string | null,
): ResolvedSessionMedia {
  return {
    resolvedImageUrl: media.thumbnailUrl || media.imageUrl,
    imageSourceType: sourceType,
    imageSourceLabel: label,
    imageAttributionName: media.attributionName,
    imageAttributionUrl: media.attributionUrl,
    imageSourceUrl: media.sourceUrl,
    matchedFitnessPlaceId,
  }
}

async function mediaAssetsTableExists() {
  if (hasMediaAssetsTable !== null) return hasMediaAssetsTable

  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'media_assets'
      ) as "exists"
    `
    hasMediaAssetsTable = Boolean(result[0]?.exists)
  } catch {
    hasMediaAssetsTable = false
  }

  return hasMediaAssetsTable
}

async function getLiveMediaAssetsByEntity(entityType: 'ACTIVITY' | 'FITNESS_PLACE', entityIds: string[]) {
  const byEntityId = new Map<string, MediaAsset>()
  const uniqueIds = [...new Set(entityIds.filter(Boolean))]
  if (uniqueIds.length === 0 || !(await mediaAssetsTableExists())) return byEntityId

  try {
    const assets = await prisma.mediaAsset.findMany({
      where: {
        entityType,
        entityId: { in: uniqueIds },
        status: 'LIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ priority: 'desc' }, { capturedAt: 'desc' }, { updatedAt: 'desc' }],
    })

    for (const asset of assets) {
      if (!byEntityId.has(asset.entityId)) byEntityId.set(asset.entityId, asset)
    }
  } catch {
    return byEntityId
  }

  return byEntityId
}

async function getCandidateFitnessPlaces() {
  try {
    return prisma.fitnessPlace.findMany({
      where: {
        isActive: true,
        moderationStatus: 'LIVE',
      },
      select: {
        id: true,
        name: true,
        address: true,
        area: true,
        latitude: true,
        longitude: true,
        googlePlaceId: true,
        coverImage: true,
        photos: true,
        sourceUrl: true,
      },
      take: 500,
    })
  } catch {
    return []
  }
}

function matchPlacesForSessions<T extends SessionMediaInput>(
  sessions: T[],
  places: FitnessPlaceMedia[],
) {
  const bySessionId = new Map<string, FitnessPlaceMedia>()
  const byGooglePlaceId = new Map<string, FitnessPlaceMedia>()

  for (const place of places) {
    if (place.googlePlaceId) byGooglePlaceId.set(place.googlePlaceId, place)
  }

  for (const session of sessions) {
    if (session.placeId && byGooglePlaceId.has(session.placeId)) {
      bySessionId.set(session.id, byGooglePlaceId.get(session.placeId)!)
      continue
    }

    const matched = findNearestLikelyPlace(session, places)
    if (matched) bySessionId.set(session.id, matched)
  }

  return bySessionId
}

function findNearestLikelyPlace<T extends SessionMediaInput>(
  session: T,
  places: FitnessPlaceMedia[],
) {
  if (typeof session.latitude !== 'number' || typeof session.longitude !== 'number') return null
  const sessionAddress = normalizeText(session.address || session.city || '')

  let best: { place: FitnessPlaceMedia; distanceKm: number; score: number } | null = null

  for (const place of places) {
    if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') continue
    const distanceKm = distanceBetweenKm(
      session.latitude,
      session.longitude,
      place.latitude,
      place.longitude,
    )
    if (distanceKm > 0.18) continue

    const placeText = normalizeText([place.name, place.address, place.area].filter(Boolean).join(' '))
    const score = addressOverlapScore(sessionAddress, placeText)
    const likelySamePlace = distanceKm <= 0.06 || score >= 2
    if (!likelySamePlace) continue

    if (!best || score > best.score || (score === best.score && distanceKm < best.distanceKm)) {
      best = { place, distanceKm, score }
    }
  }

  return best?.place ?? null
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function addressOverlapScore(left: string, right: string) {
  if (!left || !right) return 0
  const ignored = new Set(['singapore', 'road', 'street', 'ave', 'avenue', 'the', 'and'])
  const tokens = left.split(' ').filter((token) => token.length > 2 && !ignored.has(token))
  return tokens.reduce((score, token) => score + (right.includes(token) ? 1 : 0), 0)
}

function distanceBetweenKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
