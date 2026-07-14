import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

const VERIFICATION_STATUSES = new Set(['UNVERIFIED', 'VERIFIED', 'NEEDS_VERIFICATION'])
const MODERATION_STATUSES = new Set(['LIVE', 'LIMITED', 'UNDER_REVIEW', 'REJECTED', 'BLOCKED'])
const LINK_URL_FIELDS = new Set(['websiteUrl', 'communityLink', 'sourceUrl'])
const IMAGE_SOURCE_FIELDS = new Set(['coverImage', 'logoImage'])

class ValidationError extends Error {}

// PATCH - Update a community
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const adminId = await getAdminActorId(request) ?? 'admin'
    const before = await prisma.community.findUnique({
      where: { id },
      select: {
        name: true,
        category: true,
        isActive: true,
        isVerified: true,
        verificationStatus: true,
        moderationStatus: true,
        riskScore: true,
        riskFlags: true,
      },
    })

    // Only allow updating known fields
    const allowedFields = [
      'name',
      'description',
      'category',
      'coverImage',
      'logoImage',
      'instagramHandle',
      'websiteUrl',
      'communityLink',
      'usualArea',
      'usualSchedule',
      'joinPlatform',
      'vibeTags',
      'priceType',
      'beginnerFriendly',
      'sourceUrl',
      'lastVerifiedAt',
      'isActive',
      'isVerified',
      'verificationStatus',
      'moderationStatus',
      'riskScore',
      'riskFlags',
      'moderationNotes',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'instagramHandle' && body[field]) {
          updateData[field] = normalizeInstagramHandle(body[field])
        } else if (field === 'vibeTags') {
          updateData[field] = normalizeStringArray(body[field], field, 12, 40)
        } else if (field === 'beginnerFriendly') {
          updateData[field] = normalizeBoolean(body[field], field)
        } else if (field === 'lastVerifiedAt') {
          updateData[field] = normalizeOptionalDate(body[field], field)
        } else if (field === 'isVerified') {
          updateData[field] = normalizeBoolean(body[field], field)
        } else if (field === 'isActive') {
          updateData[field] = normalizeBoolean(body[field], field)
        } else if (field === 'verificationStatus') {
          updateData[field] = normalizeEnum(body[field], field, VERIFICATION_STATUSES)
        } else if (field === 'moderationStatus') {
          updateData[field] = normalizeEnum(body[field], field, MODERATION_STATUSES)
        } else if (field === 'riskScore') {
          updateData[field] = normalizeRiskScore(body[field])
        } else if (field === 'riskFlags') {
          updateData[field] = normalizeStringArray(body[field], field, 20, 80)
        } else if (LINK_URL_FIELDS.has(field)) {
          updateData[field] = normalizeOptionalUrl(body[field], field)
        } else if (IMAGE_SOURCE_FIELDS.has(field)) {
          updateData[field] = normalizeOptionalImageSource(body[field], field)
        } else if (isOptionalTextField(field)) {
          updateData[field] = normalizeOptionalString(body[field], field)
        } else if (field === 'name' || field === 'category') {
          updateData[field] = normalizeRequiredString(body[field], field)
        } else {
          updateData[field] = body[field]
        }
      }
    }

    if (updateData.isActive === true && body.moderationStatus === undefined) {
      updateData.moderationStatus = 'LIVE'
    }
    if (updateData.isVerified === true && body.verificationStatus === undefined) {
      updateData.verificationStatus = 'VERIFIED'
      updateData.lastVerifiedAt = updateData.lastVerifiedAt ?? new Date()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid community fields provided' }, { status: 400 })
    }

    const updated = await prisma.community.update({
      where: { id },
      data: updateData,
    })

    await logAdminAction({
      action: 'update_community',
      targetType: 'community',
      targetId: id,
      adminId,
      details: {
        changedFields: Object.keys(updateData),
        before,
        after: {
          name: updated.name,
          category: updated.category,
          isActive: updated.isActive,
          isVerified: updated.isVerified,
          verificationStatus: updated.verificationStatus,
          moderationStatus: updated.moderationStatus,
          riskScore: updated.riskScore,
          riskFlags: updated.riskFlags,
        },
      },
    })

    return NextResponse.json({ success: true, community: updated })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

function normalizeEnum(value: unknown, field: string, allowed: Set<string>): string {
  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new ValidationError(`${field} must be one of: ${Array.from(allowed).join(', ')}`)
  }
  return value
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new ValidationError(`${field} must be a boolean`)
}

function normalizeRiskScore(value: unknown): number {
  const score = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new ValidationError('riskScore must be an integer between 0 and 100')
  }
  return score
}

function normalizeStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxLength: number
): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`)
  }

  const normalized = value.map((item) => {
    if (typeof item !== 'string') {
      throw new ValidationError(`${field} must contain only strings`)
    }
    return item.trim()
  }).filter(Boolean)

  if (normalized.length > maxItems) {
    throw new ValidationError(`${field} can include at most ${maxItems} items`)
  }
  if (normalized.some((item) => item.length > maxLength)) {
    throw new ValidationError(`${field} items must be ${maxLength} characters or fewer`)
  }

  return Array.from(new Set(normalized))
}

function normalizeOptionalDate(value: unknown, field: string): Date | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    throw new ValidationError(`${field} must be a valid date`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid date`)
  }
  return date
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

function normalizeInstagramHandle(value: unknown): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ValidationError('instagramHandle must be a string')
  }

  const handle = value.replace(/^@/, '').toLowerCase().trim()
  if (!handle) return null
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
    throw new ValidationError('instagramHandle must be a valid Instagram handle')
  }
  return handle
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new ValidationError(`${field} is required`)
  }
  return trimmed
}

function normalizeOptionalString(value: unknown, field: string): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`)
  }
  return value.trim() || null
}

function isOptionalTextField(field: string): boolean {
  return [
    'description',
    'usualArea',
    'usualSchedule',
    'joinPlatform',
    'priceType',
    'moderationNotes',
  ].includes(field)
}

// DELETE - Deactivate a community (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const adminId = await getAdminActorId(request) ?? 'admin'
    const before = await prisma.community.findUnique({
      where: { id },
      select: {
        name: true,
        slug: true,
        isActive: true,
        moderationStatus: true,
      },
    })

    await prisma.community.update({
      where: { id },
      data: { isActive: false, moderationStatus: 'REJECTED' },
    })

    await logAdminAction({
      action: 'deactivate_community',
      targetType: 'community',
      targetId: id,
      adminId,
      details: { before },
    })

    return NextResponse.json({
      success: true,
      message: 'Community deactivated',
    })
  } catch (error) {
    console.error('Error deactivating community:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate community' },
      { status: 500 }
    )
  }
}
