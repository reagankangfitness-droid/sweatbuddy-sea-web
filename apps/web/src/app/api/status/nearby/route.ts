import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_RADIUS_KM } from '@/lib/im-down/constants'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const latitude = parseFloat(searchParams.get('latitude') || '')
  const longitude = parseFloat(searchParams.get('longitude') || '')
  const radiusKm = parseFloat(searchParams.get('radiusKm') || String(DEFAULT_RADIUS_KM))

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Haversine raw SQL for distance filtering
  const nearby = await prisma.$queryRaw<
    Array<{
      id: string
      userId: string
      activityType: string
      statusText: string | null
      latitude: number
      longitude: number
      setAt: Date
      expiresAt: Date
      distanceKm: number
      userName: string | null
      userImageUrl: string | null
      userFirstName: string | null
      userHeadline: string | null
      userInstagram: string | null
    }>
  >`
    SELECT
      us.id,
      us."userId",
      us."activityType",
      us."statusText",
      us.latitude,
      us.longitude,
      us."setAt",
      us."expiresAt",
      (6371 * acos(
        cos(radians(${latitude})) * cos(radians(us.latitude)) *
        cos(radians(us.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(us.latitude))
      )) AS "distanceKm",
      u.name AS "userName",
      u."imageUrl" AS "userImageUrl",
      u."firstName" AS "userFirstName",
      u.headline AS "userHeadline",
      u.instagram AS "userInstagram"
    FROM user_statuses us
    JOIN users u ON u.id = us."userId"
    WHERE us."expiresAt" > ${now}::timestamp
      AND us."userId" != ${dbUser.id}
      AND (6371 * acos(
        cos(radians(${latitude})) * cos(radians(us.latitude)) *
        cos(radians(us.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(us.latitude))
      )) <= ${radiusKm}
    ORDER BY "distanceKm" ASC
    LIMIT 50
  `

  return NextResponse.json({ nearby })
}
