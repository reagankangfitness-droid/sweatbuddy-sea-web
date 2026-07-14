import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { generateUniqueSlug } from '@/lib/community-system'
import { logAdminAction } from '@/lib/admin-audit'

type RouteContext = {
  params: Promise<{ id: string }>
}

type ReviewPayload = {
  action?: unknown
  category?: unknown
  city?: unknown
  description?: unknown
  usualArea?: unknown
  usualSchedule?: unknown
  joinPlatform?: unknown
  communityLink?: unknown
  websiteUrl?: unknown
  instagramHandle?: unknown
  sourceUrl?: unknown
  vibeTags?: unknown
  priceType?: unknown
  beginnerFriendly?: unknown
  adminNotes?: unknown
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const payload = await request.json().catch(() => ({})) as ReviewPayload
  const action = normalizeText(payload.action, 40)?.toLowerCase()

  if (!['approve', 'reject', 'archive', 'pending'].includes(action ?? '')) {
    return NextResponse.json({ error: 'Unsupported review action' }, { status: 400 })
  }

  const reviewedBy = await getAdminActorId(request) ?? 'admin'

  if (action === 'approve') {
    return approveNomination(id, payload, reviewedBy)
  }

  const nextStatus = action === 'reject' ? 'REJECTED' : action === 'archive' ? 'ARCHIVED' : 'PENDING'
  const moderationStatus = nextStatus === 'PENDING' ? 'UNDER_REVIEW' : 'REJECTED'
  const nomination = await prisma.$transaction(async (tx) => {
    const updated = await tx.communityNomination.update({
      where: { id },
      data: {
        status: nextStatus,
        moderationStatus,
        reviewedAt: nextStatus === 'PENDING' ? null : new Date(),
        reviewedBy: nextStatus === 'PENDING' ? null : reviewedBy,
        adminNotes: normalizeText(payload.adminNotes, 2000),
      },
    })

    if (updated.communityId) {
      await tx.community.update({
        where: { id: updated.communityId },
        data: {
          isActive: false,
          moderationStatus,
          moderationNotes: normalizeText(payload.adminNotes, 2000) ?? updated.moderationNotes,
        },
      })
    }

    return updated
  })

  await logAdminAction({
    action: `${action}_community_nomination`,
    targetType: 'community_nomination',
    targetId: id,
    adminId: reviewedBy,
    details: {
      nextStatus,
      moderationStatus,
      communityId: nomination.communityId,
      communityName: nomination.communityName,
    },
  }).catch((error) => console.error('[community-nominations audit]', error))

  return NextResponse.json({ nomination })
}

async function approveNomination(id: string, payload: ReviewPayload, reviewedBy: string) {
  const nomination = await prisma.communityNomination.findUnique({ where: { id } })
  if (!nomination) {
    return NextResponse.json({ error: 'Nomination not found' }, { status: 404 })
  }

  const category = normalizeCategory(payload.category) ?? normalizeCategory(nomination.category)
  const cityName = normalizeText(payload.city, 100) ?? nomination.city
  const sourceUrl = normalizeUrl(payload.sourceUrl) ?? normalizeUrl(nomination.sourceUrl)
  const communityLink = normalizeUrl(payload.communityLink)
  const websiteUrl = normalizeUrl(payload.websiteUrl)
  const officialLink = communityLink ?? websiteUrl ?? sourceUrl
  const usualArea = normalizeText(payload.usualArea, 160)

  if (!category) {
    return NextResponse.json({ error: 'Category is required before approval' }, { status: 400 })
  }
  if (!cityName) {
    return NextResponse.json({ error: 'City is required before approval' }, { status: 400 })
  }
  if (!usualArea) {
    return NextResponse.json({ error: 'Usual area is required before approval' }, { status: 400 })
  }
  if (!officialLink || !sourceUrl) {
    return NextResponse.json({ error: 'Official link is required before approval' }, { status: 400 })
  }

  const city = await prisma.city.findFirst({
    where: { name: { equals: cityName, mode: 'insensitive' } },
  })
  if (!city) {
    return NextResponse.json({ error: `City "${cityName}" does not exist yet` }, { status: 400 })
  }

  const instagramHandle = normalizeInstagramHandle(payload.instagramHandle)
  const description = normalizeText(payload.description, 1000)
    ?? normalizeText(nomination.note, 1000)
    ?? `${nomination.communityName} is listed from its public community page. Check the official link for the latest schedule and joining details.`

  if (nomination.communityId) {
    const result = await prisma.$transaction(async (tx) => {
      const community = await tx.community.update({
        where: { id: nomination.communityId ?? '' },
        data: {
          category,
          description,
          cityId: city.id,
          instagramHandle,
          websiteUrl,
          communityLink: communityLink ?? officialLink,
          usualArea,
          usualSchedule: normalizeText(payload.usualSchedule, 220),
          joinPlatform: normalizeText(payload.joinPlatform, 40) ?? inferJoinPlatform(officialLink),
          vibeTags: normalizeTags(payload.vibeTags),
          priceType: normalizeText(payload.priceType, 40),
          beginnerFriendly: Boolean(payload.beginnerFriendly),
          sourceUrl,
          lastVerifiedAt: new Date(),
          isVerified: true,
          verificationStatus: 'VERIFIED',
          moderationStatus: 'LIVE',
          riskScore: 0,
          riskFlags: [],
          moderationNotes: null,
          isActive: true,
          claimableBy: instagramHandle,
        },
      })
      const updatedNomination = await tx.communityNomination.update({
        where: { id },
        data: {
          status: 'APPROVED',
          moderationStatus: 'LIVE',
          riskScore: 0,
          riskFlags: [],
          reviewedAt: new Date(),
          reviewedBy,
          adminNotes: normalizeText(payload.adminNotes, 2000),
        },
      })
      return { community, nomination: updatedNomination }
    })

    await logAdminAction({
      action: 'approve_community_nomination',
      targetType: 'community',
      targetId: result.community.id,
      adminId: reviewedBy,
      details: {
        nominationId: id,
        communityName: result.community.name,
        slug: result.community.slug,
        category,
        sourceUrl,
      },
    }).catch((error) => console.error('[community-nominations audit]', error))

    return NextResponse.json(result)
  }

  const existingCommunity = await prisma.community.findFirst({
    where: {
      OR: [
        { sourceUrl },
        { communityLink: officialLink },
        { websiteUrl: officialLink },
        { name: { equals: nomination.communityName, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, slug: true },
  })
  if (existingCommunity) {
    const updated = await prisma.communityNomination.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        reviewedAt: new Date(),
        reviewedBy,
        adminNotes: `Archived as duplicate of ${existingCommunity.name} (${existingCommunity.slug}).`,
      },
    })
    return NextResponse.json({ nomination: updated, duplicateCommunity: existingCommunity })
  }

  const adminUserId = await resolveCommunityCreatorId(reviewedBy)
  if (!adminUserId) {
    return NextResponse.json({ error: 'No admin user exists to own seeded communities' }, { status: 400 })
  }

  const slug = await generateUniqueSlug(nomination.communityName)
  const createData: Prisma.CommunityCreateInput = {
    name: nomination.communityName,
    slug,
    category,
    description,
    city: { connect: { id: city.id } },
    createdBy: { connect: { id: adminUserId } },
    instagramHandle,
    websiteUrl,
    communityLink: communityLink ?? officialLink,
    usualArea,
    usualSchedule: normalizeText(payload.usualSchedule, 220),
    joinPlatform: normalizeText(payload.joinPlatform, 40) ?? inferJoinPlatform(officialLink),
    vibeTags: normalizeTags(payload.vibeTags),
    priceType: normalizeText(payload.priceType, 40),
    beginnerFriendly: Boolean(payload.beginnerFriendly),
    sourceUrl,
    lastVerifiedAt: new Date(),
    isSeeded: true,
    isVerified: true,
    verificationStatus: 'VERIFIED',
    moderationStatus: 'LIVE',
    riskScore: 0,
    riskFlags: [],
    claimableBy: instagramHandle,
    memberCount: 0,
  }

  const result = await prisma.$transaction(async (tx) => {
    const community = await tx.community.create({ data: createData })
    await tx.communityChat.create({ data: { communityId: community.id } })
    const updatedNomination = await tx.communityNomination.update({
      where: { id },
      data: {
        status: 'APPROVED',
        moderationStatus: 'LIVE',
        riskScore: 0,
        riskFlags: [],
        communityId: community.id,
        reviewedAt: new Date(),
        reviewedBy,
        adminNotes: normalizeText(payload.adminNotes, 2000),
      },
    })
    return { community, nomination: updatedNomination }
  })

  await logAdminAction({
    action: 'approve_community_nomination',
    targetType: 'community',
    targetId: result.community.id,
    adminId: reviewedBy,
    details: {
      nominationId: id,
      communityName: result.community.name,
      slug,
      category,
      sourceUrl,
    },
  }).catch((error) => console.error('[community-nominations audit]', error))

  return NextResponse.json(result)
}

async function resolveCommunityCreatorId(reviewedBy: string): Promise<string | null> {
  if (reviewedBy !== 'admin_secret' && reviewedBy !== 'admin') {
    const user = await findUserByAdminIdentifier(reviewedBy)
    if (user) return user.id
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)
  for (const id of adminIds) {
    const user = await findUserByAdminIdentifier(id)
    if (user) return user.id
  }

  return null
}

function findUserByAdminIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        { clerkUserId: identifier },
        { email: identifier.toLowerCase() },
      ],
    },
    select: { id: true },
  })
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function normalizeCategory(value: unknown): string | null {
  const text = normalizeText(value, 80)
  if (!text) return null
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
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

function normalizeInstagramHandle(value: unknown): string | null {
  const text = normalizeText(value, 100)
  if (!text) return null
  return text.replace(/^@/, '').toLowerCase()
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => normalizeText(tag, 40)).filter(Boolean).slice(0, 8) as string[]
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => normalizeText(tag, 40)).filter(Boolean).slice(0, 8) as string[]
  }
  return []
}

function inferJoinPlatform(url: string): string {
  const host = new URL(url).hostname.toLowerCase()
  if (host.includes('telegram') || host.includes('t.me')) return 'telegram'
  if (host.includes('whatsapp')) return 'whatsapp'
  if (host.includes('instagram')) return 'instagram'
  if (host.includes('strava')) return 'strava'
  if (host.includes('meetup')) return 'meetup'
  return 'website'
}
