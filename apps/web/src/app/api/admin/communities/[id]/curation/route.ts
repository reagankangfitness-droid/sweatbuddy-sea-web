import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

type CurationAction =
  | 'mark_verified'
  | 'mark_inactive'
  | 'mark_needs_verification'
  | 'update_official_link'
  | 'update_images'

const OFFICIAL_LINK_FIELDS = new Set(['communityLink', 'websiteUrl', 'sourceUrl'])

class ValidationError extends Error {}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const action = normalizeAction(body.action)
    const adminId = (await getAdminActorId(request)) ?? 'admin'
    const before = await prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isVerified: true,
        verificationStatus: true,
        moderationStatus: true,
        communityLink: true,
        websiteUrl: true,
        sourceUrl: true,
        joinPlatform: true,
        coverImage: true,
        logoImage: true,
        lastVerifiedAt: true,
      },
    })

    if (!before) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const updateData = buildUpdateData(action, body)
    const community = await prisma.community.update({
      where: { id },
      data: updateData,
    })

    await logAdminAction({
      action: `curation_${action}`,
      targetType: 'community',
      targetId: id,
      adminId,
      details: {
        changedFields: Object.keys(updateData),
        before,
        after: {
          isActive: community.isActive,
          isVerified: community.isVerified,
          verificationStatus: community.verificationStatus,
          moderationStatus: community.moderationStatus,
          communityLink: community.communityLink,
          websiteUrl: community.websiteUrl,
          sourceUrl: community.sourceUrl,
          joinPlatform: community.joinPlatform,
          coverImage: community.coverImage,
          logoImage: community.logoImage,
          lastVerifiedAt: community.lastVerifiedAt,
        },
      },
    })

    return NextResponse.json({ success: true, community })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Community curation action failed:', error)
    return NextResponse.json({ error: 'Failed to apply curation action' }, { status: 500 })
  }
}

function normalizeAction(value: unknown): CurationAction {
  if (
    value === 'mark_verified' ||
    value === 'mark_inactive' ||
    value === 'mark_needs_verification' ||
    value === 'update_official_link' ||
    value === 'update_images'
  ) {
    return value
  }

  throw new ValidationError('Unsupported curation action')
}

function buildUpdateData(action: CurationAction, body: Record<string, unknown>): Prisma.CommunityUpdateInput {
  if (action === 'mark_verified') {
    return {
      isActive: true,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      moderationStatus: 'LIVE',
      lastVerifiedAt: new Date(),
    }
  }

  if (action === 'mark_inactive') {
    return {
      isActive: false,
      moderationStatus: 'REJECTED',
      verificationStatus: 'NEEDS_VERIFICATION',
      moderationNotes: normalizeOptionalString(body.note, 'note'),
    }
  }

  if (action === 'mark_needs_verification') {
    return {
      isVerified: false,
      verificationStatus: 'NEEDS_VERIFICATION',
      moderationNotes: normalizeOptionalString(body.note, 'note'),
    }
  }

  if (action === 'update_official_link') {
    const field = normalizeLinkField(body.field)
    return {
      [field]: normalizeOptionalUrl(body.url, 'url'),
      joinPlatform: normalizeOptionalString(body.joinPlatform, 'joinPlatform'),
      isActive: true,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      moderationStatus: 'LIVE',
      lastVerifiedAt: new Date(),
    }
  }

  const coverImage = normalizeOptionalImageSource(body.coverImage, 'coverImage')
  const logoImage = normalizeOptionalImageSource(body.logoImage, 'logoImage')
  if (!coverImage && !logoImage) {
    throw new ValidationError('Provide at least one image URL')
  }

  return {
    ...(coverImage ? { coverImage } : {}),
    ...(logoImage ? { logoImage } : {}),
    lastVerifiedAt: new Date(),
  }
}

function normalizeLinkField(value: unknown): 'communityLink' | 'websiteUrl' | 'sourceUrl' {
  if (typeof value !== 'string' || !OFFICIAL_LINK_FIELDS.has(value)) {
    throw new ValidationError('field must be communityLink, websiteUrl, or sourceUrl')
  }

  return value as 'communityLink' | 'websiteUrl' | 'sourceUrl'
}

function normalizeOptionalUrl(value: unknown, field: string): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a URL string`)
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Unsupported protocol')
    }
    if (url.toString().length > 500) {
      throw new Error('URL too long')
    }
    return url.toString()
  } catch {
    throw new ValidationError(`${field} must be a valid http or https URL`)
  }
}

function normalizeOptionalImageSource(value: unknown, field: string): string | null {
  if (value === null || value === '') return null
  if (value === undefined) return null
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be an image URL string`)
  }

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 500) {
    throw new ValidationError(`${field} must be 500 characters or fewer`)
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }
  return normalizeOptionalUrl(trimmed, field)
}

function normalizeOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`)
  }
  return value.trim() || null
}
