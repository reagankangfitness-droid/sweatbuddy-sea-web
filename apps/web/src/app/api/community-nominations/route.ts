import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CommunityNominationStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { getCurrentDbUser } from '@/lib/current-user'
import { scoreCommunityListing } from '@/lib/listing-moderation'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const nominationRequests = new Map<string, number[]>()
const VALID_STATUSES = new Set<CommunityNominationStatus>(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])

type NominationPayload = {
  communityName?: unknown
  city?: unknown
  category?: unknown
  sourceUrl?: unknown
  note?: unknown
  submitterName?: unknown
  submitterEmail?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = checkNominationRateLimit(request)
    if (rateLimited) return rateLimited

    const payload = await request.json().catch(() => ({})) as NominationPayload
    const communityName = normalizeText(payload.communityName, 160)
    const city = normalizeText(payload.city, 100)
    const category = normalizeText(payload.category, 80)
    const sourceUrl = normalizeUrl(payload.sourceUrl)
    const note = normalizeText(payload.note, 1000)
    const submitterName = normalizeText(payload.submitterName, 160)
    const submitterEmail = normalizeEmail(payload.submitterEmail)

    if (!communityName) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 })
    }
    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }
    if (!sourceUrl) {
      return NextResponse.json({ error: 'A valid Instagram, website, Telegram, or group link is required' }, { status: 400 })
    }
    if (payload.submitterEmail && !submitterEmail) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const dbUser = await getCurrentDbUser().catch(() => null)
    const resolvedEmail = submitterEmail ?? dbUser?.email ?? null
    const resolvedName = submitterName ?? dbUser?.name ?? null
    const ipHash = hashIp(getRequestKey(request))
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const [duplicateCommunity, recentSubmissionCount] = await Promise.all([
      prisma.community.findFirst({
        where: {
          OR: [
            { sourceUrl },
            { communityLink: sourceUrl },
            { websiteUrl: sourceUrl },
            { name: { equals: communityName, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true },
      }),
      prisma.communityNomination.count({
        where: {
          createdAt: { gte: oneHourAgo },
          OR: [
            ...(resolvedEmail ? [{ submitterEmail: resolvedEmail }] : []),
            ...(dbUser?.id ? [{ submitterUserId: dbUser.id }] : []),
            { ipHash },
          ],
        },
      }),
    ])

    const decision = scoreCommunityListing({
      communityName,
      city,
      category,
      sourceUrl,
      note,
      submitterEmail: resolvedEmail,
      submitterUserId: dbUser?.id ?? null,
      duplicateCommunity: Boolean(duplicateCommunity),
      recentSubmissionCount,
    })

    if (decision.status === 'BLOCKED') {
      const nomination = await createNominationIfNew({
        sourceUrl,
        communityName,
        city,
        category,
        note,
        submitterName: resolvedName,
        submitterEmail: resolvedEmail,
        submitterUserId: dbUser?.id ?? null,
        ipHash,
        status: 'REJECTED',
        moderationStatus: 'BLOCKED',
        riskScore: decision.riskScore,
        riskFlags: decision.riskFlags,
        moderationNotes: decision.moderationNotes,
      })
      return NextResponse.json(
        {
          error: 'This community listing needs changes before it can be posted.',
          code: 'BLOCKED_CONTENT',
          nomination,
        },
        { status: 400 },
      )
    }

    if (duplicateCommunity) {
      const nomination = await createNominationIfNew({
        sourceUrl,
        communityName,
        city,
        category,
        note,
        submitterName: resolvedName,
        submitterEmail: resolvedEmail,
        submitterUserId: dbUser?.id ?? null,
        ipHash,
        status: 'ARCHIVED',
        moderationStatus: 'REJECTED',
        riskScore: decision.riskScore,
        riskFlags: decision.riskFlags,
        moderationNotes: `Duplicate of ${duplicateCommunity.name} (${duplicateCommunity.slug}).`,
        communityId: duplicateCommunity.id,
      })
      return NextResponse.json({ success: true, nomination, community: duplicateCommunity, duplicate: true })
    }

    const nomination = await createNominationIfNew({
      sourceUrl,
      communityName,
      city,
      category,
      note,
      submitterName: resolvedName,
      submitterEmail: resolvedEmail,
      submitterUserId: dbUser?.id ?? null,
      ipHash,
      status: 'PENDING',
      moderationStatus: 'UNDER_REVIEW',
      riskScore: decision.riskScore,
      riskFlags: decision.riskFlags,
      moderationNotes: decision.moderationNotes,
    })

    return NextResponse.json({ success: true, nomination, requiresReview: true }, { status: 202 })
  } catch (error) {
    console.error('[community-nominations POST]', error)
    return NextResponse.json({ error: 'Failed to save nomination' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('status')?.toUpperCase()
  const status = rawStatus && VALID_STATUSES.has(rawStatus as CommunityNominationStatus)
    ? rawStatus as CommunityNominationStatus
    : null

  const nominations = await prisma.communityNomination.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ nominations, total: nominations.length })
}

function checkNominationRateLimit(request: NextRequest): NextResponse | null {
  const key = getRequestKey(request)
  const now = Date.now()
  const recent = (nominationRequests.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    nominationRequests.set(key, recent)
    return NextResponse.json({ error: 'Too many nominations. Please try again later.' }, { status: 429 })
  }

  recent.push(now)
  nominationRequests.set(key, recent)
  return null
}

function getRequestKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown'
}

function hashIp(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

type UpsertNominationInput = {
  sourceUrl: string
  communityName: string
  city: string
  category: string | null
  note: string | null
  submitterName: string | null
  submitterEmail: string | null
  submitterUserId: string | null
  ipHash: string
  status: CommunityNominationStatus
  moderationStatus: 'LIVE' | 'LIMITED' | 'UNDER_REVIEW' | 'REJECTED' | 'BLOCKED'
  riskScore: number
  riskFlags: string[]
  moderationNotes: string | null
  communityId?: string
}

async function createNominationIfNew(input: UpsertNominationInput) {
  const existing = await prisma.communityNomination.findUnique({
    where: { sourceUrl: input.sourceUrl },
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      riskScore: true,
      riskFlags: true,
      communityName: true,
      communityId: true,
    },
  })

  if (existing) return existing

  return prisma.communityNomination.create({
    data: {
      communityName: input.communityName,
      city: input.city,
      category: input.category,
      sourceUrl: input.sourceUrl,
      note: input.note,
      submitterName: input.submitterName,
      submitterEmail: input.submitterEmail,
      submitterUserId: input.submitterUserId,
      ipHash: input.ipHash,
      status: input.status,
      moderationStatus: input.moderationStatus,
      riskScore: input.riskScore,
      riskFlags: input.riskFlags,
      moderationNotes: input.moderationNotes,
      communityId: input.communityId,
    },
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      riskScore: true,
      riskFlags: true,
      communityName: true,
      communityId: true,
    },
  })
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

function normalizeUrl(value: unknown): string | null {
  const text = normalizeText(value, 500)
  if (!text) return null

  try {
    const url = new URL(text.startsWith('http://') || text.startsWith('https://') ? text : `https://${text}`)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString().slice(0, 500)
  } catch {
    return null
  }
}
