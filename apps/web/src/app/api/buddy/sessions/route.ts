import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Auth is optional — unauthenticated users can browse sessions
    let dbUser: { id: string; blocksMade: { blockedUserId: string }[] } | null = null

    const { userId } = await auth()
    if (userId) {
      const clerkUser = await currentUser()
      const email = clerkUser?.primaryEmailAddress?.emailAddress
      if (email) {
        dbUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true, blocksMade: { select: { blockedUserId: true } } },
        })
      }
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') ?? 'happening'
    const activityType = searchParams.get('type') ?? ''
    const fitnessLevel = searchParams.get('fitnessLevel') ?? ''
    const pricingFilter = searchParams.get('pricing') ?? '' // 'free' | 'paid' | ''
    const cursor = searchParams.get('cursor') ?? undefined
    const PAGE_SIZE = 20

    const blockedUserIds = dbUser?.blocksMade.map((b) => b.blockedUserId) ?? []
    const verifiedFilter = searchParams.get('verified') ?? ''

    if (tab === 'mine') {
      if (!dbUser) return NextResponse.json({ hosting: [], attending: [] })
      // Sessions the user is hosting OR attending
      const [hosting, attending] = await Promise.all([
        prisma.activity.findMany({
          where: {
            userId: dbUser.id,
            activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
            deletedAt: null,
          },
          include: {
            userActivities: {
              where: { status: { in: ['JOINED', 'COMPLETED'] } },
              include: { user: { select: { id: true, name: true, imageUrl: true, slug: true } } },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        }),
        prisma.userActivity.findMany({
          where: {
            userId: dbUser.id,
            status: { in: ['JOINED', 'COMPLETED'] },
            activity: {
              activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
              userId: { not: dbUser.id },
              deletedAt: null,
            },
          },
          include: {
            activity: {
              include: {
                user: { select: { id: true, name: true, imageUrl: true, slug: true, sessionsHostedCount: true } },
                userActivities: {
                  where: { status: { in: ['JOINED', 'COMPLETED'] } },
                  include: { user: { select: { id: true, name: true, imageUrl: true, slug: true } } },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ])

      return NextResponse.json({
        hosting: hosting.map((a) => formatSession(a)),
        attending: attending.map((ua) => formatSession(ua.activity, ua.status as string)),
      })
    }

    // Tab = 'happening' — upcoming P2P sessions
    const where: Record<string, unknown> = {
      activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
      status: 'PUBLISHED',
      startTime: { gt: new Date() },
      deletedAt: null,
      ...(blockedUserIds.length > 0 ? { userId: { notIn: blockedUserIds } } : {}),
    }

    // Location-based filtering — 25km radius bounding box
    // Defaults to Singapore if no location provided (prevents showing worldwide sessions)
    const lat = searchParams.get('lat') || '1.3521'
    const lng = searchParams.get('lng') || '103.8198'
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    if (!isNaN(userLat) && !isNaN(userLng)) {
      const radiusKm = 25
      const latDelta = radiusKm / 111
      const lngDelta = radiusKm / (111 * Math.cos(userLat * (Math.PI / 180)))
      where.latitude = { gte: userLat - latDelta, lte: userLat + latDelta }
      where.longitude = { gte: userLng - lngDelta, lte: userLng + lngDelta }
    }

    // Date filtering — show sessions on a specific date
    const dateFilter = searchParams.get('date')
    if (dateFilter) {
      const filterDate = new Date(dateFilter + 'T00:00:00+08:00') // Parse as SGT
      const nextDay = new Date(filterDate.getTime() + 24 * 60 * 60 * 1000)
      where.startTime = { gte: filterDate, lt: nextDay }
    }

    if (activityType) where.categorySlug = activityType
    if (fitnessLevel) where.fitnessLevel = fitnessLevel
    if (pricingFilter === 'free') where.activityMode = 'P2P_FREE'
    if (pricingFilter === 'paid') where.activityMode = 'P2P_PAID'
    if (verifiedFilter === 'true') {
      where.user = { isCoach: true, coachVerificationStatus: 'VERIFIED' }
    }
    if (cursor) where.id = { lt: cursor }

    const sessions = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true,
            sessionsHostedCount: true,
            fitnessLevel: true,
            isCoach: true,
            coachVerificationStatus: true,
          },
        },
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          include: { user: { select: { id: true, name: true, imageUrl: true, slug: true } } },
        },
        community: {
          select: { id: true, name: true, logoImage: true, slug: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { startTime: 'asc' },
      ],
      take: PAGE_SIZE + 1,
    })

    const hasMore = sessions.length > PAGE_SIZE
    const items = hasMore ? sessions.slice(0, PAGE_SIZE) : sessions
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      sessions: items.map((a) => formatSession(a)),
      nextCursor,
      currentUserId: dbUser?.id ?? null,
    })
  } catch (error) {
    console.error('[buddy/sessions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// biome-ignore lint: using any for flexible Prisma result mapping
// eslint-disable-next-line
function formatSession(activity: ReturnType<typeof Object.assign>, userStatus?: string) {
  const attendees = (activity.userActivities as Record<string, unknown>[]) ?? []
  const isFull =
    typeof activity.maxPeople === 'number' && attendees.length >= activity.maxPeople

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    activityMode: activity.activityMode,
    categorySlug: activity.categorySlug,
    city: activity.city,
    address: activity.address,
    latitude: activity.latitude,
    longitude: activity.longitude,
    startTime: activity.startTime,
    endTime: activity.endTime,
    maxPeople: activity.maxPeople,
    price: activity.price,
    currency: activity.currency,
    status: activity.status,
    fitnessLevel: activity.fitnessLevel,
    whatToBring: activity.whatToBring,
    requiresApproval: activity.requiresApproval,
    imageUrl: activity.imageUrl,
    host: activity.user,
    community: activity.community ?? null,
    attendees: attendees.map((ua: Record<string, unknown>) => ua.user),
    attendeeCount: attendees.length,
    isFull,
    isFeatured: activity.isFeatured ?? false,
    userStatus: userStatus ?? null,
  }
}
