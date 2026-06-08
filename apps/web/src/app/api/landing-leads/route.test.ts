import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit } from '@/lib/rate-limit'
import { POST } from './route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    crewMatchLead: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  checkApiRateLimit: vi.fn(),
}))

function makeRequest(body: Record<string, unknown>) {
  return new Request('https://www.sweatbuddies.co/api/landing-leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/landing-leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkApiRateLimit).mockResolvedValue(null)
    vi.mocked(prisma.crewMatchLead.create).mockResolvedValue({
      id: 'lead-1',
      type: 'USER',
    })
  })

  it('stores a user crew match lead with normalized contact and metadata', async () => {
    const response = await POST(makeRequest({
      type: 'USER',
      city: 'Singapore',
      activityType: 'Run clubs',
      comfortLevel: 'Beginner-friendly',
      contactMethod: 'EMAIL',
      email: '  USER@Example.COM ',
      phone: '',
      name: 'Reagan',
      sourcePage: '/',
      sourcePlacement: 'hero_singapore',
      utmSource: 'instagram',
      metadata: { ctaLabel: 'Find my first crew', nested: { ignored: false } },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, id: 'lead-1', type: 'USER' })
    expect(prisma.crewMatchLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'USER',
        city: 'Singapore',
        activityType: 'Run clubs',
        comfortLevel: 'Beginner-friendly',
        contactMethod: 'EMAIL',
        email: 'user@example.com',
        phone: null,
        name: 'Reagan',
        sourcePage: '/',
        sourcePlacement: 'hero_singapore',
        utmSource: 'instagram',
        metadata: {
          ctaLabel: 'Find my first crew',
          nested: '[object Object]',
        },
      }),
      select: { id: true, type: true },
    })
  })

  it('accepts WhatsApp-only user leads', async () => {
    const response = await POST(makeRequest({
      city: 'Bangkok',
      activityType: 'Pickleball',
      contactMethod: 'WHATSAPP',
      phone: '+66 81 234 5678',
    }))

    expect(response.status).toBe(200)
    expect(prisma.crewMatchLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'USER',
        city: 'Bangkok',
        activityType: 'Pickleball',
        contactMethod: 'WHATSAPP',
        email: null,
        phone: '+66 81 234 5678',
      }),
      select: { id: true, type: true },
    })
  })

  it('rejects leads without email or WhatsApp', async () => {
    const response = await POST(makeRequest({
      city: 'Singapore',
      activityType: 'Yoga / pilates',
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Email or WhatsApp is required' })
    expect(prisma.crewMatchLead.create).not.toHaveBeenCalled()
  })

  it('rejects invalid email addresses when email is provided', async () => {
    const response = await POST(makeRequest({
      email: 'not-an-email',
      phone: '+65 8123 4567',
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid email address' })
    expect(prisma.crewMatchLead.create).not.toHaveBeenCalled()
  })
})
