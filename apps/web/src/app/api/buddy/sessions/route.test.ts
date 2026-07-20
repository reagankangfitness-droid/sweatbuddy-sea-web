import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET } from './route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activity: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/session-media', () => ({
  getCategoryFallbackImage: vi.fn(() => '/images/hero/run-club.jpg'),
  resolveSessionMediaMap: vi.fn(async () => new Map()),
}))

function makeRequest(query = '') {
  return new Request(`https://www.sweatbuddies.co/api/buddy/sessions${query}`)
}

describe('GET /api/buddy/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.activity.findMany).mockResolvedValue([] as Awaited<
      ReturnType<typeof prisma.activity.findMany>
    >)
  })

  it('bounds huge nearby radius values before querying sessions', async () => {
    const response = await GET(makeRequest('?location=nearby&lat=1.3521&lng=103.8198&radius=5000'))

    const query = vi.mocked(prisma.activity.findMany).mock.calls[0]?.[0] as {
      where: {
        latitude: { gte: number; lte: number }
      }
    }
    const radiusKm = ((query.where.latitude.lte - query.where.latitude.gte) / 2) * 111

    expect(response.status).toBe(200)
    expect(radiusKm).toBeCloseTo(80, 0)
  })

  it('falls back to the active city default radius when radius input is invalid', async () => {
    await GET(makeRequest('?location=nearby&lat=1.3521&lng=103.8198&radius=wide'))

    const query = vi.mocked(prisma.activity.findMany).mock.calls[0]?.[0] as {
      where: {
        latitude: { gte: number; lte: number }
      }
    }
    const radiusKm = ((query.where.latitude.lte - query.where.latitude.gte) / 2) * 111

    expect(radiusKm).toBeCloseTo(25, 0)
  })
})
