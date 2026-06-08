import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit } from '@/lib/rate-limit'

const LEAD_TYPES = new Set(['USER', 'HOST', 'WEEKLY_DROP'])
const CONTACT_METHODS = new Set(['EMAIL', 'WHATSAPP'])

type LeadPayload = {
  type?: unknown
  city?: unknown
  activityType?: unknown
  comfortLevel?: unknown
  contactMethod?: unknown
  email?: unknown
  phone?: unknown
  name?: unknown
  communityName?: unknown
  contactLink?: unknown
  sourcePage?: unknown
  sourcePlacement?: unknown
  utmSource?: unknown
  utmMedium?: unknown
  utmCampaign?: unknown
  metadata?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'api')
    if (rateLimited) return rateLimited

    const payload = await request.json().catch(() => ({})) as LeadPayload
    const type = normalizeEnum(payload.type, LEAD_TYPES) ?? 'USER'
    const contactMethod = normalizeEnum(payload.contactMethod, CONTACT_METHODS)
    const email = normalizeEmail(payload.email)
    const phone = normalizeText(payload.phone, 80)

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or WhatsApp is required' }, { status: 400 })
    }

    if (payload.email && !email) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const lead = await prisma.crewMatchLead.create({
      data: {
        type,
        city: normalizeText(payload.city, 80),
        activityType: normalizeText(payload.activityType, 80),
        comfortLevel: normalizeText(payload.comfortLevel, 80),
        contactMethod: contactMethod ?? (phone ? 'WHATSAPP' : 'EMAIL'),
        email,
        phone,
        name: normalizeText(payload.name, 200),
        communityName: normalizeText(payload.communityName, 200),
        contactLink: normalizeText(payload.contactLink, 500),
        sourcePage: normalizeText(payload.sourcePage, 200),
        sourcePlacement: normalizeText(payload.sourcePlacement, 120),
        utmSource: normalizeText(payload.utmSource, 120),
        utmMedium: normalizeText(payload.utmMedium, 120),
        utmCampaign: normalizeText(payload.utmCampaign, 160),
        metadata: normalizeMetadata(payload.metadata),
      },
      select: { id: true, type: true },
    })

    return NextResponse.json({ success: true, id: lead.id, type: lead.type })
  } catch (err) {
    console.error('[landing-leads POST]', err)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function normalizeEmail(value: unknown): string | null {
  const text = normalizeText(value, 255)
  if (!text) return null
  const normalized = text.toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null
}

function normalizeEnum(value: unknown, allowed: Set<string>): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return allowed.has(normalized) ? normalized : null
}

function normalizeMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const entries = Object.entries(value as Record<string, unknown>)
    .slice(0, 20)
    .map(([key, raw]) => {
      const cleanKey = key.slice(0, 80)
      if (typeof raw === 'string') return [cleanKey, raw.slice(0, 300)]
      if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) return [cleanKey, raw]
      return [cleanKey, String(raw).slice(0, 300)]
    })

  return Object.fromEntries(entries) as Prisma.InputJsonValue
}
