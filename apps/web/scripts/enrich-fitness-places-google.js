/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { PrismaClient, Prisma } = require('@prisma/client')

const { buildPlaceIntelligence } = require('../src/lib/place-intelligence-core')

loadLocalEnv()

const prisma = new PrismaClient()

const GOOGLE_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_MAPS_SERVER_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const DRY_RUN = process.env.DRY_RUN === '1'
const LIMIT = Number(process.env.PLACE_ENRICH_LIMIT || 25)
const SLUG = process.env.PLACE_ENRICH_SLUG
const CITY_SLUG = process.env.PLACE_ENRICH_CITY_SLUG || 'singapore'
const REFRESH = process.env.PLACE_ENRICH_REFRESH === '1'
const GOOGLE_API_REFERER = process.env.GOOGLE_API_REFERER || 'https://www.sweatbuddies.co/'
const MIN_LIVE_TRUST_SCORE = Number(process.env.PLACE_ENRICH_MIN_LIVE_TRUST_SCORE || 60)
const MIN_LIVE_PHOTO_SCORE = Number(process.env.PLACE_ENRICH_MIN_LIVE_PHOTO_SCORE || 50)

const DETAILS_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'googleMapsUri',
  'websiteUri',
  'nationalPhoneNumber',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'types',
  'photos',
].join(',')

const SEARCH_FIELDS = DETAILS_FIELDS.split(',').map((field) => `places.${field}`).join(',')

function loadLocalEnv() {
  for (const file of ['.env.local', '.env.production.local', '.env']) {
    const envPath = path.join(process.cwd(), file)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) continue
      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
}

async function main() {
  if (!GOOGLE_API_KEY) {
    throw new Error(
      'Missing GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_SERVER_API_KEY, GOOGLE_MAPS_API_KEY, or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    )
  }

  const places = await prisma.fitnessPlace.findMany({
    where: {
      isActive: true,
      moderationStatus: 'LIVE',
      city: { slug: CITY_SLUG },
      ...(SLUG ? { slug: SLUG } : {}),
      ...(!SLUG && !REFRESH ? { lastEnrichedAt: null } : {}),
    },
    orderBy: [{ lastEnrichedAt: 'asc' }, { updatedAt: 'asc' }],
    take: LIMIT,
  })

  const results = []
  for (const place of places) {
    try {
      const googlePlace = place.googlePlaceId
        ? await getPlaceDetails(place.googlePlaceId)
        : await searchPlace(place)

      if (!googlePlace?.id) {
        if (!DRY_RUN) {
          await prisma.fitnessPlace.update({
            where: { id: place.id },
            data: {
              moderationStatus: 'UNDER_REVIEW',
              intelligenceStatus: 'NO_GOOGLE_MATCH',
              lastEnrichedAt: new Date(),
            },
          })
        }
        results.push({ slug: place.slug, status: 'NO_MATCH' })
        continue
      }

      const existingGoogleMatch = await prisma.fitnessPlace.findUnique({
        where: { googlePlaceId: googlePlace.id },
        select: { id: true, slug: true },
      })
      if (existingGoogleMatch && existingGoogleMatch.id !== place.id) {
        if (!DRY_RUN) {
          await prisma.fitnessPlace.update({
            where: { id: place.id },
            data: {
              moderationStatus: 'UNDER_REVIEW',
              intelligenceStatus: 'DUPLICATE_GOOGLE_MATCH',
              lastEnrichedAt: new Date(),
            },
          })
        }
        results.push({
          slug: place.slug,
          status: 'DUPLICATE_GOOGLE_MATCH',
          googlePlaceId: googlePlace.id,
          matchedSlug: existingGoogleMatch.slug,
        })
        continue
      }

      const mediaAssetCount = await prisma.mediaAsset.count({
        where: { entityType: 'FITNESS_PLACE', entityId: place.id, status: 'LIVE' },
      })
      const intelligence = buildPlaceIntelligence({
        ...place,
        googlePlaceId: googlePlace.id,
        googleRating: googlePlace.rating ?? null,
        googleReviewCount: googlePlace.userRatingCount ?? 0,
        googleMapsUrl: googlePlace.googleMapsUri ?? null,
        websiteUrl: place.websiteUrl || googlePlace.websiteUri || null,
        photos: place.photos,
        mediaAssetCount: mediaAssetCount + (googlePlace.photos?.length || 0),
      })
      const updateData = {
        googlePlaceId: googlePlace.id,
        googleRating: googlePlace.rating ? new Prisma.Decimal(googlePlace.rating) : null,
        googleReviewCount: googlePlace.userRatingCount || 0,
        googleMapsUrl: googlePlace.googleMapsUri || null,
        websiteUrl: place.websiteUrl || googlePlace.websiteUri || null,
        sourceUrl: place.sourceUrl || googlePlace.googleMapsUri || null,
        sourceProvider: place.sourceProvider || 'GOOGLE_PLACES',
        openingHours: googlePlace.regularOpeningHours?.weekdayDescriptions || [],
        placeTypes: googlePlace.types || [],
        trustScore: intelligence.trustScore,
        photoQualityScore: intelligence.photoQualityScore,
        reviewSentimentScore: intelligence.reviewSentimentScore,
        aiSummary: intelligence.aiSummary,
        aiPros: intelligence.aiPros,
        aiCons: intelligence.aiCons,
        intelligenceStatus: 'GOOGLE_ENRICHED',
        rawGoogleData: googlePlace,
        lastEnrichedAt: new Date(),
        lastVerifiedAt: new Date(),
        ...(shouldMoveUnderReview(googlePlace, intelligence)
          ? { moderationStatus: 'UNDER_REVIEW' }
          : {}),
      }

      if (!DRY_RUN) {
        await prisma.fitnessPlace.update({ where: { id: place.id }, data: updateData })
        await upsertGooglePhotoAssets(place.id, googlePlace)
      }

      results.push({
        slug: place.slug,
        name: place.name,
        status: DRY_RUN ? 'DRY_RUN' : 'ENRICHED',
        visibility: shouldMoveUnderReview(googlePlace, intelligence) && !DRY_RUN ? 'UNDER_REVIEW' : 'LIVE',
        googlePlaceId: googlePlace.id,
        rating: googlePlace.rating || null,
        reviews: googlePlace.userRatingCount || 0,
        photos: googlePlace.photos?.length || 0,
        trustScore: intelligence.trustScore,
      })
    } catch (error) {
      results.push({
        slug: place.slug,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(JSON.stringify({ dryRun: DRY_RUN, count: results.length, results }, null, 2))
}

async function getPlaceDetails(placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': DETAILS_FIELDS,
      Referer: GOOGLE_API_REFERER,
    },
  })
  if (!response.ok) throw new Error(`Place Details failed: ${response.status} ${await response.text()}`)
  return response.json()
}

async function searchPlace(place) {
  const body = {
    textQuery: [place.name, place.address || place.area || 'Singapore', 'fitness'].filter(Boolean).join(' '),
    maxResultCount: 3,
    languageCode: 'en',
    regionCode: 'SG',
  }

  if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: place.latitude, longitude: place.longitude },
        radius: 800,
      },
    }
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': SEARCH_FIELDS,
      Referer: GOOGLE_API_REFERER,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Text Search failed: ${response.status} ${await response.text()}`)
  const payload = await response.json()
  return chooseBestMatch(place, payload.places || [])
}

function chooseBestMatch(place, candidates) {
  if (candidates.length === 0) return null
  const normalizedName = normalize(place.name)
  const normalizedAddress = normalize(place.address || place.area || '')

  return candidates
    .map((candidate) => {
      const candidateName = normalize(candidate.displayName?.text || '')
      const candidateAddress = normalize(candidate.formattedAddress || '')
      let score = 0
      if (candidateName === normalizedName) score += 60
      if (candidateName.includes(normalizedName) || normalizedName.includes(candidateName)) score += 25
      for (const token of normalizedName.split(' ').filter((value) => value.length > 2)) {
        if (candidateName.includes(token)) score += 5
      }
      for (const token of normalizedAddress.split(' ').filter((value) => value.length > 3)) {
        if (candidateAddress.includes(token)) score += 2
      }
      if (candidate.rating) score += 5
      if (candidate.photos?.length) score += 5
      return { candidate, score }
    })
    .sort((left, right) => right.score - left.score)[0]?.candidate
}

function shouldMoveUnderReview(googlePlace, intelligence) {
  if (intelligence.trustScore < MIN_LIVE_TRUST_SCORE) return true
  if (intelligence.photoQualityScore < MIN_LIVE_PHOTO_SCORE) return true
  if (hasClearlyNonFitnessTypes(googlePlace.types || [])) return true
  return false
}

function hasClearlyNonFitnessTypes(types) {
  const typeSet = new Set(types)
  const allowed = [
    'fitness_center',
    'gym',
    'sports_activity_location',
    'sports_complex',
    'sports_school',
    'sports_coaching',
    'yoga_studio',
    'wellness_center',
    'physiotherapist',
  ]
  if (allowed.some((type) => typeSet.has(type))) return false

  return [
    'restaurant',
    'food',
    'food_store',
    'grocery_store',
    'asian_grocery_store',
    'store',
    'clothing_store',
    'womens_clothing_store',
    'sportswear_store',
    'sporting_goods_store',
  ].some((type) => typeSet.has(type))
}

async function upsertGooglePhotoAssets(placeId, googlePlace) {
  const photos = (googlePlace.photos || []).slice(0, 8)
  for (const [index, photo] of photos.entries()) {
    const attribution = photo.authorAttributions?.[0] || null
    const imageUrl = `/api/place-photo?placeId=${encodeURIComponent(googlePlace.id)}&photoIndex=${index}&maxWidth=900`
    const existing = await prisma.mediaAsset.findFirst({
      where: {
        entityType: 'FITNESS_PLACE',
        entityId: placeId,
        sourceType: 'GOOGLE_PLACE',
        externalId: `${googlePlace.id}:${index}`,
      },
    })
    const data = {
      entityType: 'FITNESS_PLACE',
      entityId: placeId,
      sourceType: 'GOOGLE_PLACE',
      imageUrl,
      thumbnailUrl: imageUrl,
      sourceUrl: googlePlace.googleMapsUri || null,
      externalId: `${googlePlace.id}:${index}`,
      attributionName: attribution?.displayName || null,
      attributionUrl: attribution?.uri || null,
      priority: 70 - index,
      status: 'LIVE',
      capturedAt: new Date(),
      lastFetchedAt: new Date(),
      expiresAt: null,
    }

    if (existing) {
      await prisma.mediaAsset.update({ where: { id: existing.id }, data })
    } else {
      await prisma.mediaAsset.create({ data })
    }
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
