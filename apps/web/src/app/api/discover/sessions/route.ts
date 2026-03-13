import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''

    const now = new Date()

    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        latitude: { not: 0 },
        longitude: { not: 0 },
        OR: [
          { startTime: null },
          { startTime: { gte: now } },
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
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true,
          },
        },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 200,
    })

    const sessions = activities.map((a) => {
      const attendeeCount = a.userActivities.length
      const isFull = a.maxPeople ? attendeeCount >= a.maxPeople : false
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
        isFull,
        host: {
          id: a.user.id,
          name: a.user.name,
          imageUrl: a.user.imageUrl,
          slug: a.user.slug,
        },
      }
    })

    return NextResponse.json({ sessions, total: sessions.length })
  } catch (err) {
    console.error('[discover/sessions]', err)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}
