import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET } from './route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fitnessPlace: {
      findMany: vi.fn(),
    },
    mediaAsset: {
      findMany: vi.fn(),
    },
  },
}))

const singaporeCenter = { lat: 1.3521, lng: 103.8198 }

function makeRequest(query = '') {
  return new Request(`https://www.sweatbuddies.co/api/map/places${query}`)
}

function mockLivePlace(overrides: Record<string, unknown> = {}) {
  return {
    id: 'place-1',
    slug: 'marina-bay-run-loop',
    name: 'Marina Bay Run Loop',
    description: 'Waterfront running route.',
    placeType: 'OUTDOOR_FITNESS',
    area: 'Marina Bay',
    address: 'Marina Bay, Singapore',
    latitude: 1.2816,
    longitude: 103.8636,
    coverImage: 'https://example.com/cover.jpg',
    photos: ['https://example.com/photo-a.jpg', 'https://example.com/thumb.jpg'],
    activities: ['running'],
    vibeTags: ['beginner-friendly'],
    communityTypes: ['run club'],
    bestFor: 'Social easy runs',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 88,
    bookingUrl: null,
    websiteUrl: 'https://example.com/place',
    sourceUrl: 'https://example.com/source',
    averageRating: 4.8,
    googleRating: 4.7,
    googleReviewCount: 123,
    googleMapsUrl: 'https://maps.google.com/?cid=123',
    trustScore: 92,
    photoQualityScore: 80,
    reviewSentimentScore: 76,
    isFeatured: true,
    lastVerifiedAt: new Date('2026-07-17T10:30:00.000Z'),
    city: { name: 'Singapore', slug: 'singapore' },
    _count: { communityLinks: 2, reviews: 5 },
    ...overrides,
  }
}

describe('GET /api/map/places', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.fitnessPlace.findMany).mockResolvedValue([mockLivePlace()] as unknown as Awaited<
      ReturnType<typeof prisma.fitnessPlace.findMany>
    >)
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([
      {
        entityId: 'place-1',
        imageUrl: 'https://example.com/media-full.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      },
      {
        entityId: 'place-1',
        imageUrl: 'https://example.com/media-second.jpg',
        thumbnailUrl: null,
      },
    ] as Awaited<ReturnType<typeof prisma.mediaAsset.findMany>>)
  })

  it('returns live reviewed places with deduped media-first photos', async () => {
    const response = await GET(makeRequest('?city=singapore&type=yoga&lat=1.3&lng=103.8&radius=5'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120')
    expect(body).toEqual({
      success: true,
      data: {
        city: 'singapore',
        total: 1,
        places: [
          expect.objectContaining({
            id: 'place-1',
            slug: 'marina-bay-run-loop',
            imageUrl: 'https://example.com/thumb.jpg',
            photos: [
              'https://example.com/thumb.jpg',
              'https://example.com/media-second.jpg',
              'https://example.com/photo-a.jpg',
              'https://example.com/cover.jpg',
            ],
            googleRating: 4.7,
            lastVerifiedAt: '2026-07-17T10:30:00.000Z',
            communityLinkCount: 2,
            reviewCount: 5,
            listingIntent: 'join_a_crew',
            joinPath: 'Crew linked',
            socialSignal: 'Strong',
            publicPriority: 'Featured',
            socialUsefulnessScore: expect.any(Number),
          }),
        ],
      },
    })

    expect(prisma.fitnessPlace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          moderationStatus: 'LIVE',
          city: { slug: 'singapore' },
          OR: expect.arrayContaining([
            { activities: { has: 'yoga' } },
            { placeType: 'STUDIO' },
            { placeTypes: { has: 'yoga_studio' } },
          ]),
        }),
        orderBy: [
          { isFeatured: 'desc' },
          { trustScore: 'desc' },
          { googleReviewCount: 'desc' },
          { name: 'asc' },
        ],
        take: 500,
      }),
    )
    expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: 'FITNESS_PLACE',
          entityId: { in: ['place-1'] },
          status: 'LIVE',
        }),
      }),
    )
  })

  it('scopes a known city request to the city center when coordinates are outside its detection radius', async () => {
    await GET(makeRequest('?city=singapore&lat=35.6762&lng=139.6503&radius=10'))

    const query = vi.mocked(prisma.fitnessPlace.findMany).mock.calls[0]?.[0] as {
      where: {
        latitude: { gte: number; lte: number }
        longitude: { gte: number; lte: number }
        city: { slug: string }
      }
    }
    const latRadius = query.where.latitude.lte - singaporeCenter.lat
    const lngRadius = query.where.longitude.lte - singaporeCenter.lng

    expect(query.where.city).toEqual({ slug: 'singapore' })
    expect(query.where.latitude.gte).toBeCloseTo(singaporeCenter.lat - latRadius, 6)
    expect(query.where.latitude.lte).toBeCloseTo(singaporeCenter.lat + latRadius, 6)
    expect(query.where.longitude.gte).toBeCloseTo(singaporeCenter.lng - lngRadius, 6)
    expect(query.where.longitude.lte).toBeCloseTo(singaporeCenter.lng + lngRadius, 6)
  })

  it('uses coordinate-first discovery without a city relation filter for nearby requests', async () => {
    await GET(makeRequest('?location=nearby&lat=35.6762&lng=139.6503&radius=10'))

    const query = vi.mocked(prisma.fitnessPlace.findMany).mock.calls[0]?.[0] as {
      where: {
        latitude: { gte: number; lte: number }
        longitude: { gte: number; lte: number }
        city?: { slug: string }
      }
    }
    const latCenter = (query.where.latitude.gte + query.where.latitude.lte) / 2
    const lngCenter = (query.where.longitude.gte + query.where.longitude.lte) / 2

    expect(query.where.city).toBeUndefined()
    expect(latCenter).toBeCloseTo(35.6762, 6)
    expect(lngCenter).toBeCloseTo(139.6503, 6)
  })

  it('falls back to the default radius when radius input is not numeric', async () => {
    await GET(makeRequest('?location=nearby&lat=1.3521&lng=103.8198&radius=wide'))

    const query = vi.mocked(prisma.fitnessPlace.findMany).mock.calls[0]?.[0] as {
      where: {
        latitude: { gte: number; lte: number }
      }
    }
    const radiusKm = ((query.where.latitude.lte - query.where.latitude.gte) / 2) * 111

    expect(radiusKm).toBeCloseTo(25, 0)
  })

  it('orders places by emitted social usefulness score', async () => {
    vi.mocked(prisma.fitnessPlace.findMany).mockResolvedValueOnce([
      mockLivePlace({
        id: 'place-low',
        slug: 'review-heavy-generic-gym',
        name: 'Review Heavy Generic Gym',
        placeType: 'GYM',
        activities: ['gym'],
        vibeTags: [],
        communityTypes: [],
        dropInFriendly: false,
        beginnerFriendly: false,
        socialScore: 10,
        trustScore: 20,
        photoQualityScore: 20,
        isFeatured: false,
        websiteUrl: null,
        sourceUrl: null,
        googleReviewCount: 900,
        _count: { communityLinks: 0, reviews: 0 },
      }),
      mockLivePlace({
        id: 'place-high',
        slug: 'beginner-run-crew',
        name: 'Beginner Run Crew',
        activities: ['running'],
        communityTypes: ['run club'],
        socialScore: 82,
        googleReviewCount: 12,
        _count: { communityLinks: 1, reviews: 0 },
      }),
    ] as unknown as Awaited<ReturnType<typeof prisma.fitnessPlace.findMany>>)

    const response = await GET(makeRequest('?city=singapore'))
    const body = await response.json()

    expect(body.data.places.map((place: { slug: string }) => place.slug)).toEqual([
      'beginner-run-crew',
      'review-heavy-generic-gym',
    ])
    expect(body.data.places[0].socialUsefulnessScore).toBeGreaterThan(
      body.data.places[1].socialUsefulnessScore,
    )
  })

  it('skips media lookup and returns an empty map payload when no places match', async () => {
    vi.mocked(prisma.fitnessPlace.findMany).mockResolvedValueOnce([] as Awaited<
      ReturnType<typeof prisma.fitnessPlace.findMany>
    >)

    const response = await GET(makeRequest('?city=singapore'))
    const body = await response.json()

    expect(body).toEqual({
      success: true,
      data: {
        city: 'singapore',
        total: 0,
        places: [],
      },
    })
    expect(prisma.mediaAsset.findMany).not.toHaveBeenCalled()
  })
})
