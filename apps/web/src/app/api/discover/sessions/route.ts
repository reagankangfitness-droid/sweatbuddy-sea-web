import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''

    const now = new Date()
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        latitude: { not: 0 },
        longitude: { not: 0 },
        OR: [
          { startTime: null },
          { startTime: { gte: windowStart, lte: windowEnd } },
        ],
        ...(category ? { categorySlug: category } : {}),
      },
      select: {
        id: true,
        title: true,
        categorySlug: true,
        activityMode: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        startTime: true,
        address: true,
        city: true,
        price: true,
        maxPeople: true,
        requiresApproval: true,
        fitnessLevel: true,
        userId: true,
        // Use _count instead of fetching all userActivity rows
        _count: {
          select: {
            userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 100,
    })

    // Batch-fetch hosts in one query instead of N includes
    const hostIds = [...new Set(activities.map((a) => a.userId))]
    const hosts = await prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, name: true, imageUrl: true, slug: true },
    })
    const hostMap = new Map(hosts.map((h) => [h.id, h]))

    const sessions = activities.map((a) => {
      const attendeeCount = a._count.userActivities
      const host = hostMap.get(a.userId)
      return {
        id: a.id,
        title: a.title,
        categorySlug: a.categorySlug ?? 'other',
        activityMode: a.activityMode,
        imageUrl: a.imageUrl,
        latitude: a.latitude,
        longitude: a.longitude,
        startTime: a.startTime?.toISOString() ?? null,
        address: a.address,
        city: a.city,
        price: a.price,
        maxPeople: a.maxPeople,
        requiresApproval: a.requiresApproval,
        fitnessLevel: a.fitnessLevel,
        attendeeCount,
        isFull: a.maxPeople ? attendeeCount >= a.maxPeople : false,
        host: host ? { id: host.id, name: host.name, imageUrl: host.imageUrl, slug: host.slug } : null,
      }
    })

    // Also fetch communities with coordinates
    const communityWhere: Record<string, unknown> = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    }
    if (category) communityWhere.category = category

    const communityRecords = await prisma.community.findMany({
      where: communityWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        logoImage: true,
        coverImage: true,
        latitude: true,
        longitude: true,
        address: true,
        memberCount: true,
        instagramHandle: true,
        city: { select: { name: true } },
      },
      take: 200,
    })

    const communities = communityRecords.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      description: c.description,
      logoImage: c.logoImage,
      coverImage: c.coverImage,
      latitude: c.latitude!,
      longitude: c.longitude!,
      address: c.address,
      city: c.city?.name ?? null,
      memberCount: c.memberCount,
      instagramHandle: c.instagramHandle,
    }))

    return NextResponse.json({ sessions, communities, total: sessions.length })
  } catch (err) {
    console.error('[discover/sessions]', err)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}
