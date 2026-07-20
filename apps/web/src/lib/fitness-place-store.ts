import type { MediaAsset, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { compareListingsBySocialUsefulness } from '@/lib/listing-positioning'
import {
  getPlaceBySlug,
  singaporeFitnessPlaces,
  type FitnessPlace,
  type FitnessPlaceType,
} from '@/lib/fitness-directory'

type DbFitnessPlace = Prisma.FitnessPlaceGetPayload<{}>
type PlaceMediaAsset = Pick<
  MediaAsset,
  'entityId' | 'imageUrl' | 'thumbnailUrl' | 'sourceUrl' | 'attributionName' | 'attributionUrl'
>

const coverByType: Record<string, string> = {
  GYM: '/banner/athletics.jpg',
  STUDIO: '/images/hero/meditation.png',
  OUTDOOR_FITNESS: '/images/community-bonds.jpg',
  SPORTS_FACILITY: '/images/organizers-bg.jpg',
  WELLNESS: '/images/hero/ice-bath.webp',
  COMMUNITY_SPACE: '/images/cities/singapore.jpg',
}

let hasFitnessPlacesTable: boolean | null = null

const nonSingaporePlacePattern =
  /\b(johor|johor bahru|iskandar puteri|medini|malaysia|batam|indonesia)\b|\b(79250|80100)\b/i

async function fitnessPlacesTableExists() {
  if (hasFitnessPlacesTable !== null) return hasFitnessPlacesTable

  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'fitness_places'
      ) as "exists"
    `
    hasFitnessPlacesTable = Boolean(result[0]?.exists)
  } catch {
    hasFitnessPlacesTable = false
  }

  return hasFitnessPlacesTable
}

function mapPlaceType(type: string): FitnessPlaceType {
  const mapping: Record<string, FitnessPlaceType> = {
    GYM: 'gym',
    STUDIO: 'studio',
    OUTDOOR_FITNESS: 'outdoor_fitness',
    SPORTS_FACILITY: 'sports_facility',
    WELLNESS: 'wellness',
    COMMUNITY_SPACE: 'community_space',
  }

  return mapping[type] ?? 'community_space'
}

function toDirectoryPlace(place: DbFitnessPlace, mediaAssets: PlaceMediaAsset[] = []): FitnessPlace {
  const mediaPhotos = mediaAssets.map((asset) => asset.thumbnailUrl || asset.imageUrl).filter(Boolean)
  const coverImage =
    mediaPhotos[0] || place.coverImage || coverByType[place.placeType] || '/images/cities/singapore.jpg'
  const reviewCount = place.reviewCount || 0
  const averageRating = Number(place.averageRating || 0)
  const googleRating = place.googleRating ? Number(place.googleRating) : null

  return {
    slug: place.slug,
    name: place.name,
    placeType: mapPlaceType(place.placeType),
    area: place.area || 'Singapore',
    address: place.address || place.area || 'Singapore',
    city: 'Singapore',
    latitude: place.latitude || 1.3521,
    longitude: place.longitude || 103.8198,
    description:
      place.description ||
      `${place.name} is listed in the SweatBuddies Singapore fitness directory.`,
    coverImage,
    photos: [...new Set([...mediaPhotos, ...place.photos, coverImage])],
    activities: place.activities,
    amenities: place.amenities,
    vibeTags: place.vibeTags,
    communityTypes: place.communityTypes,
    priceSummary: place.priceSummary || 'Check official source for current pricing',
    trialSummary: place.trialSummary || 'Check official source before visiting',
    bestFor: place.bestFor || 'Fitness sessions, local training, and community activity.',
    bestTimes: place.bestTimes || 'Check official source for current hours',
    dropInFriendly: place.dropInFriendly,
    beginnerFriendly: place.beginnerFriendly,
    socialScore: place.socialScore,
    averageRating: averageRating > 0 ? averageRating : 0,
    reviewCount,
    googleRating,
    googleReviewCount: place.googleReviewCount,
    googleMapsUrl: place.googleMapsUrl,
    trustScore: place.trustScore,
    photoQualityScore: place.photoQualityScore,
    reviewSentimentScore: place.reviewSentimentScore,
    aiSummary: place.aiSummary,
    aiPros: place.aiPros,
    aiCons: place.aiCons,
    intelligenceStatus: place.intelligenceStatus,
    lastEnrichedAt: place.lastEnrichedAt?.toISOString() ?? null,
    openingHours: place.openingHours,
    placeTypes: place.placeTypes,
    websiteUrl: place.websiteUrl,
    sourceUrl: place.sourceUrl,
    sourceProvider: place.sourceProvider,
    lastVerifiedAt: place.lastVerifiedAt?.toISOString() ?? null,
    reviewHighlights: [],
    relatedCommunities: [],
  }
}

function isSingaporeDirectoryRow(place: DbFitnessPlace) {
  const locationText = [place.name, place.slug, place.area, place.address].filter(Boolean).join(' ')
  return !nonSingaporePlacePattern.test(locationText)
}

function mergePlaces(primary: FitnessPlace[], fallback: FitnessPlace[]) {
  const bySlug = new Map<string, FitnessPlace>()
  for (const place of fallback) bySlug.set(place.slug, place)
  for (const place of primary) bySlug.set(place.slug, place)
  return [...bySlug.values()].sort(compareListingsBySocialUsefulness)
}

async function getLiveMediaAssetsByPlace(placeIds: string[]) {
  const byPlaceId = new Map<string, PlaceMediaAsset[]>()
  if (placeIds.length === 0) return byPlaceId

  try {
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
        sourceUrl: true,
        attributionName: true,
        attributionUrl: true,
      },
      orderBy: [{ priority: 'desc' }, { capturedAt: 'desc' }, { updatedAt: 'desc' }],
    })

    for (const asset of assets) {
      const placeAssets = byPlaceId.get(asset.entityId) || []
      if (placeAssets.length < 6) {
        placeAssets.push(asset)
        byPlaceId.set(asset.entityId, placeAssets)
      }
    }
  } catch (error) {
    console.warn('Could not load place media assets:', error)
  }

  return byPlaceId
}

export async function getFitnessDirectoryPlaces(): Promise<FitnessPlace[]> {
  try {
    if (!(await fitnessPlacesTableExists())) return singaporeFitnessPlaces

    const rows = await prisma.fitnessPlace.findMany({
      where: {
        isActive: true,
        moderationStatus: 'LIVE',
        city: { slug: 'singapore' },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { socialScore: 'desc' },
        { trustScore: 'desc' },
        { name: 'asc' },
      ],
      take: 500,
    })

    const singaporeRows = rows.filter(isSingaporeDirectoryRow)

    if (singaporeRows.length === 0) return singaporeFitnessPlaces
    const mediaByPlaceId = await getLiveMediaAssetsByPlace(singaporeRows.map((place) => place.id))
    return mergePlaces(
      singaporeRows.map((place) => toDirectoryPlace(place, mediaByPlaceId.get(place.id))),
      singaporeFitnessPlaces,
    )
  } catch (error) {
    console.warn('Falling back to seeded fitness directory places:', error)
    return singaporeFitnessPlaces
  }
}

export async function getFitnessDirectoryPlaceBySlug(slug: string): Promise<FitnessPlace | undefined> {
  try {
    if (!(await fitnessPlacesTableExists())) return getPlaceBySlug(slug)

    const row = await prisma.fitnessPlace.findUnique({
      where: { slug },
    })

    if (row?.isActive && row.moderationStatus === 'LIVE' && isSingaporeDirectoryRow(row)) {
      const mediaByPlaceId = await getLiveMediaAssetsByPlace([row.id])
      return toDirectoryPlace(row, mediaByPlaceId.get(row.id))
    }
  } catch (error) {
    console.warn('Falling back to seeded fitness directory place:', error)
  }

  return getPlaceBySlug(slug)
}
