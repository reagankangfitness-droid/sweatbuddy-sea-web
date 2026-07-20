const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN === '1'

async function tableExists() {
  const result = await prisma.$queryRaw`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'media_assets'
    ) as "exists"
  `
  return Boolean(result[0]?.exists)
}

function isPublicHttpImage(url) {
  return typeof url === 'string' && /^https:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(url)
}

function sourceTypeForUrl(url) {
  return url.includes('commons.wikimedia.org') ? 'WIKIMEDIA' : 'WEBSITE'
}

async function upsertMediaAsset(data) {
  const existing = await prisma.mediaAsset.findFirst({
    where: {
      entityType: data.entityType,
      entityId: data.entityId,
      imageUrl: data.imageUrl,
    },
    select: { id: true },
  })

  if (DRY_RUN) return existing ? 'unchanged' : 'created'

  if (existing) {
    await prisma.mediaAsset.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        priority: data.priority,
        sourceUrl: data.sourceUrl,
        attributionName: data.attributionName,
        attributionUrl: data.attributionUrl,
        license: data.license,
        lastFetchedAt: new Date(),
      },
    })
    return 'updated'
  }

  await prisma.mediaAsset.create({ data })
  return 'created'
}

async function syncPlacePhotos() {
  const places = await prisma.fitnessPlace.findMany({
    where: {
      isActive: true,
      moderationStatus: 'LIVE',
      photos: { isEmpty: false },
    },
    select: {
      id: true,
      slug: true,
      sourceUrl: true,
      photos: true,
    },
  })

  const counters = { created: 0, updated: 0, unchanged: 0 }

  for (const place of places) {
    for (const imageUrl of place.photos.filter(isPublicHttpImage).slice(0, 3)) {
      const result = await upsertMediaAsset({
        entityType: 'FITNESS_PLACE',
        entityId: place.id,
        sourceType: sourceTypeForUrl(imageUrl),
        imageUrl,
        thumbnailUrl: null,
        sourceUrl: place.sourceUrl || imageUrl,
        externalId: imageUrl,
        attributionName: imageUrl.includes('commons.wikimedia.org') ? 'Wikimedia Commons' : null,
        attributionUrl: imageUrl.includes('commons.wikimedia.org') ? imageUrl : null,
        license: imageUrl.includes('commons.wikimedia.org') ? 'See source' : null,
        priority: 35,
        status: 'LIVE',
        capturedAt: null,
        lastFetchedAt: new Date(),
      })
      counters[result] += 1
    }
  }

  return counters
}

async function syncReviewPhotos() {
  const reviews = await prisma.fitnessPlaceReview.findMany({
    where: {
      status: 'PUBLISHED',
      photos: { isEmpty: false },
      place: {
        isActive: true,
        moderationStatus: 'LIVE',
      },
    },
    select: {
      id: true,
      photos: true,
      createdAt: true,
      place: { select: { id: true, slug: true } },
      reviewer: { select: { name: true } },
    },
  })

  const counters = { created: 0, updated: 0, unchanged: 0 }

  for (const review of reviews) {
    for (const imageUrl of review.photos.filter(isPublicHttpImage).slice(0, 5)) {
      const result = await upsertMediaAsset({
        entityType: 'FITNESS_PLACE',
        entityId: review.place.id,
        sourceType: 'REVIEW',
        imageUrl,
        thumbnailUrl: null,
        sourceUrl: `/places/${review.place.slug}#reviews`,
        externalId: `${review.id}:${imageUrl}`,
        attributionName: review.reviewer?.name || 'SweatBuddies review',
        attributionUrl: null,
        license: 'User submitted',
        priority: 70,
        status: 'LIVE',
        capturedAt: review.createdAt,
        lastFetchedAt: new Date(),
      })
      counters[result] += 1
    }
  }

  return counters
}

async function main() {
  if (!(await tableExists())) {
    throw new Error('media_assets table does not exist. Run prisma migrate deploy first.')
  }

  const [placePhotos, reviewPhotos] = await Promise.all([syncPlacePhotos(), syncReviewPhotos()])
  console.log(JSON.stringify({ dryRun: DRY_RUN, placePhotos, reviewPhotos }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
