import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

const ACTIONS = new Set(['approve', 'reject', 'block', 'review', 'duplicate', 'feature', 'normal', 'hide'])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const action = String(body.action ?? '').toLowerCase()
    const notes = normalizeOptionalText(body.notes)

    if (!ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const before = await prisma.fitnessPlace.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        isFeatured: true,
        moderationStatus: true,
        trustScore: true,
        photoQualityScore: true,
        googlePlaceId: true,
        intelligenceStatus: true,
        lastVerifiedAt: true,
      },
    })

    if (!before) {
      return NextResponse.json({ error: 'Fitness place not found' }, { status: 404 })
    }

    const adminId = await getAdminActorId(request) ?? 'admin'
    const updateData = buildUpdateData(action, notes)

    const place = await prisma.$transaction(async (tx) => {
      const updated = await tx.fitnessPlace.update({
        where: { id },
        data: updateData,
        include: {
          city: { select: { name: true, slug: true } },
          _count: { select: { communityLinks: true, reviews: true } },
        },
      })

      if (action === 'approve' || action === 'feature' || action === 'normal') {
        await tx.mediaAsset.updateMany({
          where: { entityType: 'FITNESS_PLACE', entityId: id, status: 'NEEDS_REVIEW' },
          data: { status: 'LIVE' },
        })
      }

      if (action === 'reject' || action === 'block') {
        await tx.mediaAsset.updateMany({
          where: { entityType: 'FITNESS_PLACE', entityId: id },
          data: { status: 'REJECTED' },
        })
      }

      return updated
    })

    await logAdminAction({
      action: `PLACE_${action.toUpperCase()}`,
      targetType: 'FitnessPlace',
      targetId: id,
      adminId,
      details: {
        before,
        after: {
          isActive: place.isActive,
          moderationStatus: place.moderationStatus,
          intelligenceStatus: place.intelligenceStatus,
          lastVerifiedAt: place.lastVerifiedAt,
          isFeatured: place.isFeatured,
        },
        notes,
      },
    })

    return NextResponse.json({
      place: {
        ...place,
        averageRating: Number(place.averageRating),
        googleRating: place.googleRating === null ? null : Number(place.googleRating),
      },
    })
  } catch (error) {
    console.error('Fitness place moderation error:', error)
    return NextResponse.json({ error: 'Failed to update fitness place' }, { status: 500 })
  }
}

function buildUpdateData(action: string, notes: string | null) {
  const base = {
    moderationNotes: notes,
  }

  if (action === 'approve') {
    return {
      ...base,
      moderationStatus: 'LIVE' as const,
      isActive: true,
      intelligenceStatus: 'ADMIN_APPROVED',
      lastVerifiedAt: new Date(),
    }
  }

  if (action === 'reject') {
    return {
      ...base,
      moderationStatus: 'REJECTED' as const,
      isActive: false,
      intelligenceStatus: 'ADMIN_REJECTED',
    }
  }

  if (action === 'block') {
    return {
      ...base,
      moderationStatus: 'BLOCKED' as const,
      isActive: false,
      intelligenceStatus: 'ADMIN_BLOCKED',
    }
  }

  if (action === 'duplicate') {
    return {
      ...base,
      moderationStatus: 'UNDER_REVIEW' as const,
      isActive: true,
      intelligenceStatus: 'DUPLICATE_MANUAL_REVIEW',
    }
  }

  if (action === 'feature') {
    return {
      ...base,
      moderationStatus: 'LIVE' as const,
      isActive: true,
      isFeatured: true,
      intelligenceStatus: 'ADMIN_FEATURED_SOCIAL',
      lastVerifiedAt: new Date(),
    }
  }

  if (action === 'normal') {
    return {
      ...base,
      moderationStatus: 'LIVE' as const,
      isActive: true,
      isFeatured: false,
      intelligenceStatus: 'ADMIN_NORMAL_PRIORITY',
    }
  }

  if (action === 'hide') {
    return {
      ...base,
      moderationStatus: 'LIMITED' as const,
      isActive: false,
      isFeatured: false,
      intelligenceStatus: 'ADMIN_HIDDEN_GENERIC_INVENTORY',
    }
  }

  return {
    ...base,
    moderationStatus: 'UNDER_REVIEW' as const,
    isActive: true,
    intelligenceStatus: 'ADMIN_REVIEW_REQUIRED',
  }
}

function normalizeOptionalText(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 2000)
}
