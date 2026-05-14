import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  findCityLocationConfig,
  getCityLocationConfig,
  getNearestCityLocationConfig,
  isPointInsideCityDetectionRadius,
} from '@/lib/location-config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const type = searchParams.get('type') ?? 'all' // 'all' | 'sessions' | 'crews'

    if (!q) {
      return NextResponse.json({ sessions: [], crews: [] })
    }

    // Auth is optional — unauthenticated users can search
    let dbUserId: string | null = null
    const { userId } = await auth()
    if (userId) {
      const clerkUser = await currentUser()
      const email = clerkUser?.primaryEmailAddress?.emailAddress
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        })
        dbUserId = dbUser?.id ?? null
      }
    }

    const now = new Date()
    const results: { sessions?: unknown[]; crews?: unknown[] } = {}

    // ── Search Sessions ──────────────────────────────────────────────────────
    if (type === 'all' || type === 'sessions') {
      const requestedCitySlug = searchParams.get('city')
      const knownRequestedCity = findCityLocationConfig(requestedCitySlug)
      const requestedCity = knownRequestedCity ?? getCityLocationConfig(requestedCitySlug)
      const parsedLat = parseFloat(searchParams.get('lat') ?? '')
      const parsedLng = parseFloat(searchParams.get('lng') ?? '')
      const hasValidCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng)
      const providedPoint = { lat: parsedLat, lng: parsedLng }
      const activeCity = knownRequestedCity
        ? requestedCity
        : hasValidCoordinates
          ? getNearestCityLocationConfig(parsedLat, parsedLng)
          : requestedCity
      const scopedPoint = knownRequestedCity && hasValidCoordinates && isPointInsideCityDetectionRadius(knownRequestedCity, providedPoint)
        ? providedPoint
        : hasValidCoordinates && !knownRequestedCity
          ? providedPoint
          : activeCity.center
      const radiusKm = parseInt(searchParams.get('radius') || String(activeCity.defaultRadius), 10)
      const latDelta = radiusKm / 111
      const lngDelta = radiusKm / (111 * Math.cos(scopedPoint.lat * (Math.PI / 180)))

      const sessionWhere: Prisma.ActivityWhereInput = {
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        status: 'PUBLISHED',
        deletedAt: null,
        startTime: { gt: now },
        latitude: { gte: scopedPoint.lat - latDelta, lte: scopedPoint.lat + latDelta },
        longitude: { gte: scopedPoint.lng - lngDelta, lte: scopedPoint.lng + lngDelta },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { categorySlug: q.toLowerCase() },
        ],
      }

      const sessions = await prisma.activity.findMany({
        where: sessionWhere,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          categorySlug: true,
          startTime: true,
          address: true,
          city: true,
          price: true,
          activityMode: true,
          currency: true,
          maxPeople: true,
          status: true,
          fitnessLevel: true,
          whatToBring: true,
          requiresApproval: true,
          description: true,
          endTime: true,
          latitude: true,
          longitude: true,
          _count: {
            select: {
              userActivities: {
                where: { status: { in: ['JOINED', 'COMPLETED'] } },
              },
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              logoImage: true,
              slug: true,
            },
          },
          ratingSummary: {
            select: { averageRating: true, totalReviews: true },
          },
          host: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              slug: true,
              sessionsHostedCount: true,
              fitnessLevel: true,
            },
          },
          userActivities: dbUserId
            ? {
                where: { userId: dbUserId },
                select: { status: true },
                take: 1,
              }
            : false,
        },
        orderBy: { startTime: 'asc' },
        take: 20,
      })

      results.sessions = sessions.map((s) => ({
        id: s.id,
        title: s.title,
        imageUrl: s.imageUrl,
        categorySlug: s.categorySlug,
        startTime: s.startTime,
        address: s.address,
        city: s.city,
        price: s.price,
        activityMode: s.activityMode,
        currency: s.currency,
        maxPeople: s.maxPeople,
        status: s.status,
        fitnessLevel: s.fitnessLevel,
        whatToBring: s.whatToBring,
        requiresApproval: s.requiresApproval,
        description: s.description,
        endTime: s.endTime,
        latitude: s.latitude,
        longitude: s.longitude,
        attendeeCount: s._count.userActivities,
        isFull: s.maxPeople ? s._count.userActivities >= s.maxPeople : false,
        host: s.host,
        community: s.community,
        attendees: [],
        userStatus: (s.userActivities as { status: string }[])?.[0]?.status ?? null,
        avgRating: s.ratingSummary ? Number(s.ratingSummary.averageRating) : null,
        reviewCount: s.ratingSummary?.totalReviews ?? 0,
      }))
    }

    // ── Search Crews ─────────────────────────────────────────────────────────
    if (type === 'all' || type === 'crews') {
      const crews = await prisma.community.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logoImage: true,
          category: true,
          memberCount: true,
          description: true,
        },
        orderBy: { memberCount: 'desc' },
        take: 20,
      })

      results.crews = crews
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[search] error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
