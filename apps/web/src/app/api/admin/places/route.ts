import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

const MODERATION_STATUSES = new Set(['LIVE', 'LIMITED', 'UNDER_REVIEW', 'REJECTED', 'BLOCKED'])

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'UNDER_REVIEW'
  const query = searchParams.get('q')?.trim()
  const city = searchParams.get('city')?.trim()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10)))
  const skip = (page - 1) * limit

  if (status !== 'all' && !MODERATION_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const where: Prisma.FitnessPlaceWhereInput = {
    ...(status !== 'all' ? { moderationStatus: status as Prisma.EnumListingModerationStatusFilter['equals'] } : {}),
    ...(city ? { city: { name: { equals: city, mode: 'insensitive' } } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { area: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { sourceProvider: { contains: query, mode: 'insensitive' } },
            { intelligenceStatus: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [places, total, counts, liveWeakCount] = await Promise.all([
    prisma.fitnessPlace.findMany({
      where,
      include: {
        city: { select: { name: true, slug: true } },
        _count: { select: { communityLinks: true, reviews: true } },
      },
      orderBy: [
        { moderationStatus: 'asc' },
        { trustScore: 'asc' },
        { photoQualityScore: 'asc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
      skip,
    }),
    prisma.fitnessPlace.count({ where }),
    prisma.fitnessPlace.groupBy({
      by: ['moderationStatus'],
      _count: { moderationStatus: true },
    }),
    prisma.fitnessPlace.count({
      where: {
        isActive: true,
        moderationStatus: 'LIVE',
        OR: [
          { trustScore: { lt: 70 } },
          { photoQualityScore: { lt: 50 } },
          { googlePlaceId: null },
        ],
      },
    }),
  ])

  const mediaByPlaceId = await getMediaByPlaceId(places.map((place) => place.id))

  return NextResponse.json({
    places: places.map((place) => ({
      ...place,
      averageRating: Number(place.averageRating),
      googleRating: place.googleRating === null ? null : Number(place.googleRating),
      mediaAssets: mediaByPlaceId.get(place.id) ?? [],
    })),
    total,
    page,
    limit,
    counts,
    liveWeakCount,
  })
}

async function getMediaByPlaceId(placeIds: string[]) {
  const byPlaceId = new Map<string, Array<{
    id: string
    imageUrl: string
    thumbnailUrl: string | null
    sourceUrl: string | null
    sourceType: string
    status: string
    priority: number
  }>>()
  if (placeIds.length === 0) return byPlaceId

  const assets = await prisma.mediaAsset.findMany({
    where: {
      entityType: 'FITNESS_PLACE',
      entityId: { in: placeIds },
      status: { in: ['LIVE', 'NEEDS_REVIEW'] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      entityId: true,
      imageUrl: true,
      thumbnailUrl: true,
      sourceUrl: true,
      sourceType: true,
      status: true,
      priority: true,
    },
    orderBy: [{ priority: 'desc' }, { capturedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  for (const asset of assets) {
    const current = byPlaceId.get(asset.entityId) ?? []
    if (current.length < 4) {
      current.push({
        id: asset.id,
        imageUrl: asset.imageUrl,
        thumbnailUrl: asset.thumbnailUrl,
        sourceUrl: asset.sourceUrl,
        sourceType: asset.sourceType,
        status: asset.status,
        priority: asset.priority,
      })
      byPlaceId.set(asset.entityId, current)
    }
  }

  return byPlaceId
}
