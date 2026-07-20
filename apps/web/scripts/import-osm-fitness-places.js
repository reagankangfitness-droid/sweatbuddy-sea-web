const { PrismaClient } = require('@prisma/client')
const {
  classifyOsmFitnessPlace,
  isLikelyDuplicate,
  slugify,
} = require('../src/lib/fitness-place-aggregation')

const prisma = new PrismaClient()

const CITY = process.env.OSM_IMPORT_CITY || 'Singapore'
const CITY_SLUG = process.env.OSM_IMPORT_CITY_SLUG || slugify(CITY)
const COUNTRY = process.env.OSM_IMPORT_COUNTRY || CITY
const COUNTRY_CODE = process.env.OSM_IMPORT_COUNTRY_CODE || (CITY_SLUG === 'singapore' ? 'SG' : 'XX')
const TIMEZONE = process.env.OSM_IMPORT_TIMEZONE || (CITY_SLUG === 'singapore' ? 'Asia/Singapore' : 'UTC')
const CITY_LATITUDE = Number(process.env.OSM_IMPORT_CITY_LAT || 1.3521)
const CITY_LONGITUDE = Number(process.env.OSM_IMPORT_CITY_LNG || 103.8198)
const WRITE = process.env.OSM_IMPORT_WRITE === '1'
const AUTO_PUBLISH_MIN = Number(process.env.OSM_IMPORT_AUTOPUBLISH_MIN || 85)
const LIMIT = Number(process.env.OSM_IMPORT_LIMIT || 0)
const ENDPOINT = process.env.OVERPASS_ENDPOINT || 'https://overpass-api.de/api/interpreter'
const USER_AGENT = process.env.OSM_IMPORT_USER_AGENT || 'SweatBuddiesFitnessImporter/1.0 (https://www.sweatbuddies.co)'
const QUERY_DELAY_MS = Number(process.env.OSM_IMPORT_QUERY_DELAY_MS || 2500)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldPublishCandidate(candidate) {
  const name = candidate.name || ''
  const address = String(candidate.address || '').trim()
  const genericExact = /^(fitness|gym|singapore|court|field|pitch|sports|track|swimming complex|fitness centre|fitness center|fitness corner|fitness station)$/i
  const hasWeakAddress = !address || /^\d+[a-z]?$/i.test(address)
  const hasGenericName =
    genericExact.test(name.trim()) ||
    /^pitch\s+\d+$/i.test(name) ||
    /^fitness\s*(centre|center|corner|station)?$/i.test(name) ||
    /^(elderly\s+)?fitness corner$/i.test(name) ||
    /^block\s+\d+\s+fitness centre$/i.test(name) ||
    /^blk\s+\w+\s+(basketball|street soccer|soccer)\s+court$/i.test(name) ||
    /\b(primary|secondary|college)\b/i.test(name) ||
    /\b(basketball|street soccer|soccer)\s+court$/i.test(name) ||
    /^(court|pitch)\b/i.test(name)

  if (String(name).trim().length < 4) return false
  if (!candidate.websiteUrl && hasWeakAddress) return false
  if (hasGenericName) return false
  if (candidate.placeType === 'OUTDOOR_FITNESS' && !candidate.websiteUrl) return false
  return true
}

const SINGAPORE_BBOX = '1.16,103.55,1.49,104.12'
const IMPORT_BBOX = process.env.OSM_IMPORT_BBOX || SINGAPORE_BBOX

function buildOverpassQuery(filter) {
  return `
[out:json][timeout:45][bbox:${IMPORT_BBOX}];
(
  nwr${filter};
);
out center tags;
`.trim()
}

function buildOverpassQueries() {
  return [
    ['fitness_centre', buildOverpassQuery('["leisure"="fitness_centre"]')],
    ['fitness_station', buildOverpassQuery('["leisure"="fitness_station"]')],
    ['sports_centre', buildOverpassQuery('["leisure"="sports_centre"]')],
    ['swimming_pool', buildOverpassQuery('["leisure"="swimming_pool"]')],
    ['track', buildOverpassQuery('["leisure"="track"]')],
    ['gym', buildOverpassQuery('["amenity"="gym"]')],
    ['dojo', buildOverpassQuery('["amenity"="dojo"]')],
    [
      'sports',
      buildOverpassQuery(
        '["sport"~"^(badminton|basketball|climbing|fitness|martial_arts|padel|pickleball|running|soccer|swimming|table_tennis|tennis|yoga)$"]',
      ),
    ],
  ]
}

async function fetchOverpassElements(query, attempt = 1) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': USER_AGENT,
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(120000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    if ([429, 504].includes(response.status) && attempt < 4) {
      const waitMs = QUERY_DELAY_MS * attempt * 3
      console.warn(`Overpass returned ${response.status}; retrying in ${waitMs}ms`)
      await sleep(waitMs)
      return fetchOverpassElements(query, attempt + 1)
    }
    throw new Error(`Overpass returned ${response.status}: ${body.slice(0, 500)}`)
  }

  const json = await response.json()
  return Array.isArray(json.elements) ? json.elements : []
}

async function getOrCreateCity() {
  const existing = await prisma.city.findUnique({ where: { slug: CITY_SLUG } })
  if (existing) return existing

  return prisma.city.create({
    data: {
      name: CITY,
      slug: CITY_SLUG,
      country: COUNTRY,
      countryCode: COUNTRY_CODE.slice(0, 2).toUpperCase(),
      timezone: TIMEZONE,
      latitude: CITY_LATITUDE,
      longitude: CITY_LONGITUDE,
      coverImage: CITY_SLUG === 'singapore' ? '/images/cities/singapore.jpg' : null,
      isLaunched: true,
      launchedAt: new Date(),
    },
  })
}

async function uniqueFitnessPlaceSlug(base) {
  const cleanBase = slugify(base) || 'fitness-place'
  let slug = cleanBase
  let counter = 1

  while (await prisma.fitnessPlace.findUnique({ where: { slug }, select: { id: true } })) {
    counter += 1
    slug = `${cleanBase}-${counter}`
  }

  return slug
}

async function findExistingPlace(candidate) {
  if (candidate.sourceId) {
    const byOsm = await prisma.fitnessPlace.findUnique({
      where: { osmElementId: candidate.sourceId },
    })
    if (byOsm) return byOsm
  }

  const nearby = await prisma.fitnessPlace.findMany({
    where: {
      city: { slug: CITY_SLUG },
      OR: [
        { name: { equals: candidate.name, mode: 'insensitive' } },
        candidate.websiteUrl ? { websiteUrl: candidate.websiteUrl } : undefined,
        candidate.area ? { area: candidate.area } : undefined,
      ].filter(Boolean),
    },
    take: 25,
  })

  return nearby.find((place) => isLikelyDuplicate(candidate, place)) || null
}

function publishData(candidate, cityId, slug) {
  const description = candidate.bestFor
    ? `${candidate.name} is listed from OpenStreetMap as a ${candidate.placeType.toLowerCase().replace(/_/g, ' ')} in ${candidate.area || CITY}. ${candidate.bestFor}`
    : `${candidate.name} is a fitness place in ${candidate.area || CITY}.`

  return {
    name: candidate.name,
    slug,
    description,
    placeType: candidate.placeType,
    cityId,
    area: candidate.area,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    coverImage: coverImageForPlaceType(candidate.placeType),
    photos: candidate.photos || [],
    activities: candidate.activities,
    amenities: candidate.amenities,
    vibeTags: candidate.vibeTags,
    communityTypes: candidate.communityTypes,
    priceSummary: candidate.priceSummary,
    trialSummary: candidate.trialSummary,
    bestFor: candidate.bestFor,
    bestTimes: null,
    dropInFriendly: candidate.dropInFriendly,
    beginnerFriendly: candidate.beginnerFriendly,
    socialScore: candidate.socialScore,
    osmElementId: candidate.sourceId,
    sourceProvider: 'OSM',
    sourceExternalId: candidate.sourceId,
    websiteUrl: candidate.websiteUrl,
    sourceUrl: candidate.sourceUrl,
    moderationStatus: 'LIVE',
    isActive: true,
    isSeeded: false,
    lastVerifiedAt: new Date(),
  }
}

function coverImageForPlaceType(placeType) {
  if (placeType === 'STUDIO') return '/images/hero/meditation.png'
  if (placeType === 'OUTDOOR_FITNESS') return '/images/community-bonds.jpg'
  if (placeType === 'SPORTS_FACILITY') return '/images/organizers-bg.jpg'
  if (placeType === 'WELLNESS') return '/images/hero/ice-bath.webp'
  return '/banner/athletics.jpg'
}

async function processCandidate(candidate, city, importRunId, counters) {
  const existingPlace = await findExistingPlace(candidate)
  const existingPublishedFromSameSource = existingPlace?.osmElementId === candidate.sourceId
  const publishable = shouldPublishCandidate(candidate)
  const status = existingPlace
    ? existingPublishedFromSameSource ? 'AUTO_PUBLISHED' : 'MERGED'
    : publishable && candidate.confidenceScore >= AUTO_PUBLISH_MIN
      ? 'AUTO_PUBLISHED'
      : 'NEEDS_REVIEW'

  const discovered = await prisma.discoveredFitnessPlace.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: 'OSM',
        sourceId: candidate.sourceId,
      },
    },
    create: {
      importRunId,
      sourceType: 'OSM',
      sourceId: candidate.sourceId,
      sourceUrl: candidate.sourceUrl,
      name: candidate.name,
      normalizedName: candidate.normalizedName,
      placeType: candidate.placeType,
      city: candidate.city,
      area: candidate.area,
      address: candidate.address,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      websiteUrl: candidate.websiteUrl,
      phone: candidate.phone,
      activities: candidate.activities,
      amenities: candidate.amenities,
      vibeTags: candidate.vibeTags,
      communityTypes: candidate.communityTypes,
      bestFor: candidate.bestFor,
      priceSummary: candidate.priceSummary,
      trialSummary: candidate.trialSummary,
      dropInFriendly: candidate.dropInFriendly,
      beginnerFriendly: candidate.beginnerFriendly,
      socialScore: candidate.socialScore,
      confidenceScore: candidate.confidenceScore,
      status,
      matchedPlaceId: existingPlace?.id,
      publishedPlaceId: existingPublishedFromSameSource ? existingPlace.id : undefined,
      rawData: candidate.rawData,
      sourceTags: candidate.sourceTags,
    },
    update: {
      importRunId,
      sourceUrl: candidate.sourceUrl,
      name: candidate.name,
      normalizedName: candidate.normalizedName,
      placeType: candidate.placeType,
      city: candidate.city,
      area: candidate.area,
      address: candidate.address,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      websiteUrl: candidate.websiteUrl,
      phone: candidate.phone,
      activities: candidate.activities,
      amenities: candidate.amenities,
      vibeTags: candidate.vibeTags,
      communityTypes: candidate.communityTypes,
      bestFor: candidate.bestFor,
      priceSummary: candidate.priceSummary,
      trialSummary: candidate.trialSummary,
      dropInFriendly: candidate.dropInFriendly,
      beginnerFriendly: candidate.beginnerFriendly,
      socialScore: candidate.socialScore,
      confidenceScore: candidate.confidenceScore,
      status,
      matchedPlaceId: existingPlace?.id,
      publishedPlaceId: existingPublishedFromSameSource ? existingPlace.id : undefined,
      rawData: candidate.rawData,
      sourceTags: candidate.sourceTags,
      lastSeenAt: new Date(),
    },
  })

  if (discovered.createdAt.getTime() === discovered.updatedAt.getTime()) counters.created += 1
  else counters.updated += 1

  if (existingPlace) {
    if (existingPublishedFromSameSource) {
      if (publishable) {
        await prisma.fitnessPlace.update({
          where: { id: existingPlace.id },
          data: publishData(candidate, city.id, existingPlace.slug),
        })
      } else {
        await prisma.fitnessPlace.update({
          where: { id: existingPlace.id },
          data: {
            isActive: false,
            moderationStatus: 'REJECTED',
            lastVerifiedAt: new Date(),
          },
        })
      }
    }

    counters.skipped += 1
    return
  }

  if (!publishable || candidate.confidenceScore < AUTO_PUBLISH_MIN) {
    counters.skipped += 1
    return
  }

  const slug = await uniqueFitnessPlaceSlug(`${candidate.name} ${candidate.area || candidate.city}`)
  const published = await prisma.fitnessPlace.create({
    data: publishData(candidate, city.id, slug),
  })

  await prisma.discoveredFitnessPlace.update({
    where: { id: discovered.id },
    data: {
      publishedPlaceId: published.id,
      publishedAt: new Date(),
      status: 'AUTO_PUBLISHED',
    },
  })

  counters.published += 1
}

async function main() {
  console.log(`Fetching OSM fitness places for ${CITY} from ${ENDPOINT}`)
  const queries = buildOverpassQueries()
  const elementsById = new Map()

  for (const [label, query] of queries) {
    if (elementsById.size > 0) await sleep(QUERY_DELAY_MS)
    console.log(`Fetching ${label}...`)
    const batch = await fetchOverpassElements(query)
    console.log(`  ${batch.length} elements`)
    for (const element of batch) {
      elementsById.set(`${element.type}/${element.id}`, element)
    }
  }

  const elements = [...elementsById.values()]
  const candidates = elements
    .map((element) => classifyOsmFitnessPlace(element, { city: CITY }))
    .filter(Boolean)
    .filter((candidate) => candidate.name && candidate.latitude && candidate.longitude)
    .slice(0, LIMIT > 0 ? LIMIT : undefined)

  const bySourceId = new Map()
  for (const candidate of candidates) {
    bySourceId.set(candidate.sourceId, candidate)
  }
  const uniqueCandidates = [...bySourceId.values()]
  const byPlaceType = uniqueCandidates.reduce((counts, candidate) => {
    counts[candidate.placeType] = (counts[candidate.placeType] || 0) + 1
    return counts
  }, {})

  console.log(JSON.stringify({
    mode: WRITE ? 'write' : 'dry-run',
    city: CITY,
    fetched: elements.length,
    classified: candidates.length,
    unique: uniqueCandidates.length,
    byPlaceType,
    autoPublishThreshold: AUTO_PUBLISH_MIN,
    sample: uniqueCandidates.slice(0, 8).map((candidate) => ({
      name: candidate.name,
      placeType: candidate.placeType,
      confidenceScore: candidate.confidenceScore,
      activities: candidate.activities,
      area: candidate.area,
    })),
  }, null, 2))

  if (!WRITE) {
    console.log('Dry run only. Set OSM_IMPORT_WRITE=1 to stage and auto-publish high-confidence records.')
    return
  }

  const city = await getOrCreateCity()
  const importRun = await prisma.fitnessPlaceImportRun.create({
    data: {
      sourceType: 'OSM',
      city: CITY,
      query: queries.map(([label, query]) => `-- ${label}\n${query}`).join('\n\n'),
      status: 'RUNNING',
      candidatesFound: uniqueCandidates.length,
    },
  })

  const counters = { created: 0, updated: 0, published: 0, skipped: 0, errors: 0 }

  try {
    for (const candidate of uniqueCandidates) {
      try {
        await processCandidate(candidate, city, importRun.id, counters)
      } catch (error) {
        counters.errors += 1
        console.error(`Failed candidate ${candidate.name}:`, error)
      }
    }

    await prisma.fitnessPlaceImportRun.update({
      where: { id: importRun.id },
      data: {
        status: counters.errors > 0 ? 'FAILED' : 'COMPLETED',
        candidatesCreated: counters.created,
        candidatesUpdated: counters.updated,
        publishedCount: counters.published,
        skippedCount: counters.skipped,
        errorCount: counters.errors,
        completedAt: new Date(),
      },
    })

    console.log(JSON.stringify({ importRunId: importRun.id, ...counters }, null, 2))
  } catch (error) {
    await prisma.fitnessPlaceImportRun.update({
      where: { id: importRun.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    })
    throw error
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
