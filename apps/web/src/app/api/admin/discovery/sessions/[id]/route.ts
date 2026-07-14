import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'
import { geocodeAddress } from '@/lib/geocode'
import { getCityLocationConfig } from '@/lib/location-config'

const REVIEW_ACTIONS = new Set(['approve', 'reject', 'duplicate', 'archive', 'pending'])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const action = String(body.action ?? '').toLowerCase()
    if (!REVIEW_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { userId: clerkAdminId } = await auth()
    const adminId = await getAdminActorId(request) ?? clerkAdminId ?? 'admin'

    if (action === 'approve') {
      const result = await approveDiscoveredSession(id, adminId)
      return result
    }

    const status =
      action === 'approve' ? 'APPROVED' :
      action === 'reject' ? 'REJECTED' :
      action === 'duplicate' ? 'DUPLICATE' :
      action === 'archive' ? 'ARCHIVED' :
      'PENDING'

    const session = await prisma.discoveredSession.update({
      where: { id },
      data: {
        status,
        reviewedAt: action === 'pending' ? null : new Date(),
        reviewedBy: action === 'pending' ? null : adminId,
        rejectionReason: action === 'reject' ? String(body.rejectionReason ?? '').trim() || null : null,
      },
      include: { source: true },
    })

    await logAdminAction({
      action: `DISCOVERY_${status}`,
      targetType: 'DiscoveredSession',
      targetId: id,
      adminId,
      details: { sourceId: session.sourceId, sourceUrl: session.sourceUrl },
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Discovered session review error:', error)
    return NextResponse.json({ error: 'Failed to update discovered session' }, { status: 500 })
  }
}

async function approveDiscoveredSession(id: string, adminId: string) {
  const discovered = await prisma.discoveredSession.findUnique({
    where: { id },
    include: { source: true, createdActivity: true },
  })

  if (!discovered) {
    return NextResponse.json({ error: 'Discovered session not found' }, { status: 404 })
  }

  if (discovered.createdActivityId && discovered.createdActivity) {
    const session = await prisma.discoveredSession.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
      include: { source: true, createdActivity: { select: { id: true, title: true, status: true } } },
    })

    await logAdminAction({
      action: 'DISCOVERY_APPROVED_EXISTING_ACTIVITY',
      targetType: 'DiscoveredSession',
      targetId: id,
      adminId,
      details: {
        sourceId: discovered.sourceId,
        sourceUrl: discovered.sourceUrl,
        activityId: discovered.createdActivityId,
      },
    })

    return NextResponse.json({ session })
  }

  if (!discovered.startTime) {
    return NextResponse.json({ error: 'Start time is required before publishing to the map' }, { status: 400 })
  }

  const adminUserId = await resolveAdminUserId(adminId)
  if (!adminUserId) {
    return NextResponse.json({ error: 'No admin user exists to own discovered sessions' }, { status: 400 })
  }

  const community = discovered.communityName
    ? await prisma.community.findFirst({
        where: { name: { equals: discovered.communityName, mode: 'insensitive' } },
        select: { id: true, name: true, createdById: true, category: true, logoImage: true, coverImage: true },
      })
    : null

  const cityConfig = getCityLocationConfig(discovered.city)
  let latitude = discovered.latitude ?? null
  let longitude = discovered.longitude ?? null
  if ((latitude === null || longitude === null) && discovered.location) {
    const coords = await geocodeAddress(`${discovered.location}, ${discovered.city}`)
    latitude = coords?.lat ?? null
    longitude = coords?.lng ?? null
  }

  const categorySlug = normalizeCategory(discovered.category ?? community?.category)
  const price = discovered.price ?? 0
  const ownerId = community?.createdById || adminUserId

  const result = await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: {
        title: discovered.title,
        description: buildPublishedDescription(discovered.description, discovered.sourceUrl, discovered.signupUrl),
        type: mapActivityType(categorySlug),
        categorySlug,
        city: discovered.city || cityConfig.name,
        address: discovered.location,
        latitude: latitude ?? cityConfig.center.lat,
        longitude: longitude ?? cityConfig.center.lng,
        startTime: discovered.startTime,
        endTime: discovered.endTime,
        imageUrl: discovered.imageUrl || community?.coverImage || community?.logoImage || null,
        price,
        currency: discovered.currency || 'SGD',
        status: 'PUBLISHED',
        userId: ownerId,
        hostId: ownerId,
        communityId: community?.id ?? null,
        sessionType: community ? 'COMMUNITY' : null,
        activityMode: price > 0 ? 'P2P_PAID' : 'P2P_FREE',
        fitnessLevel: 'ALL',
        requiresApproval: false,
        moderationStatus: 'LIVE',
        riskScore: 0,
        riskFlags: [],
        moderationNotes: null,
      },
    })

    const session = await tx.discoveredSession.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        createdActivityId: activity.id,
      },
      include: { source: true, createdActivity: { select: { id: true, title: true, status: true } } },
    })

    return { activity, session }
  })

  await logAdminAction({
    action: 'DISCOVERY_APPROVED_PUBLISHED_ACTIVITY',
    targetType: 'DiscoveredSession',
    targetId: id,
    adminId,
    details: {
      sourceId: discovered.sourceId,
      sourceUrl: discovered.sourceUrl,
      activityId: result.activity.id,
      title: result.activity.title,
      communityId: community?.id ?? null,
      usedFallbackCoordinates: discovered.latitude === null || discovered.longitude === null,
    },
  })

  return NextResponse.json({ session: result.session, activity: result.activity })
}

async function resolveAdminUserId(adminId: string): Promise<string | null> {
  if (adminId !== 'admin' && adminId !== 'admin_secret') {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: adminId }, { clerkUserId: adminId }] },
      select: { id: true },
    })
    if (user) return user.id
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)
  for (const id of adminIds) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { clerkUserId: id }] },
      select: { id: true },
    })
    if (user) return user.id
  }

  return null
}

function normalizeCategory(value: string | null | undefined): string | null {
  if (!value) return null
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || null
}

function mapActivityType(categorySlug: string | null) {
  const typeMap = {
    running: 'RUN',
    gym: 'GYM',
    strength: 'GYM',
    yoga: 'YOGA',
    hiking: 'HIKE',
    cycling: 'CYCLING',
  } as const

  return (categorySlug && typeMap[categorySlug as keyof typeof typeMap]) || 'OTHER'
}

function buildPublishedDescription(description: string | null, sourceUrl: string, signupUrl: string | null): string {
  const parts = [
    description?.trim(),
    `Source: ${sourceUrl}`,
    signupUrl ? `Join: ${signupUrl}` : null,
  ].filter(Boolean)

  return parts.join('\n\n')
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const adminId = await getAdminActorId(request) ?? 'admin'
    const session = await prisma.discoveredSession.findUnique({
      where: { id },
      select: {
        title: true,
        status: true,
        sourceId: true,
        sourceUrl: true,
        createdActivityId: true,
      },
    })
    await prisma.discoveredSession.delete({ where: { id } })
    await logAdminAction({
      action: 'delete_discovered_session',
      targetType: 'DiscoveredSession',
      targetId: id,
      adminId,
      details: session ?? {},
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discovered session delete error:', error)
    return NextResponse.json({ error: 'Failed to delete discovered session' }, { status: 500 })
  }
}
