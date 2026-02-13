import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WAVE_EXPIRY_MS, DEFAULT_RADIUS_KM, WAVE_ACTIVITY_TYPES } from '@/lib/wave/constants'
import { WaveActivityType } from '@prisma/client'
import { getBlockedUserIds } from '@/lib/blocks'
import { getSGToday, isTodaySG, isThisWeekendSG, getNextOccurrenceSG, combineDateTimeSG } from '@/lib/event-dates'

const VALID_TYPES = new Set<string>(WAVE_ACTIVITY_TYPES)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let dbUser = await prisma.user.findFirst({ where: { id: userId } })
    if (!dbUser) {
      // Auto-create/link user from Clerk if not in DB by ID
      const clerkUser = await currentUser()
      if (!clerkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

      // Check if user exists by email (created via webhook with old ID format)
      const existingByEmail = email ? await prisma.user.findUnique({ where: { email } }) : null

      if (existingByEmail) {
        // Update the existing record's ID to match the Clerk ID
        // This handles the cuid → clerk ID migration
        await prisma.$executeRawUnsafe(
          `UPDATE users SET id = $1 WHERE id = $2`,
          clerkUser.id,
          existingByEmail.id
        )
        dbUser = { ...existingByEmail, id: clerkUser.id }
      } else {
        dbUser = await prisma.user.create({
          data: {
            id: clerkUser.id,
            email,
            name,
            imageUrl: clerkUser.imageUrl || null,
          },
        })
      }
    }

    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
    const { activityType, area, locationName, latitude, longitude, scheduledFor, thought } = body as {
      activityType: string
      area: string
      locationName?: string
      latitude?: number
      longitude?: number
      scheduledFor?: string
      thought?: string
    }

    if (!activityType || !area) {
      return NextResponse.json({ error: 'activityType and area are required' }, { status: 400 })
    }

    if (!VALID_TYPES.has(activityType)) {
      return NextResponse.json({ error: 'Invalid activityType' }, { status: 400 })
    }

    if (area.length > 200) {
      return NextResponse.json({ error: 'Area too long' }, { status: 400 })
    }

    if (latitude != null && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
    }
    if (longitude != null && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
    }

    if (locationName && locationName.length > 300) {
      return NextResponse.json({ error: 'Location name too long' }, { status: 400 })
    }

    if (thought && thought.length > 140) {
      return NextResponse.json({ error: 'Thought must be 140 characters or less' }, { status: 400 })
    }

    if (scheduledFor) {
      const d = new Date(scheduledFor)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 })
      if (d.getTime() < Date.now()) return NextResponse.json({ error: 'scheduledFor must be in the future' }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + WAVE_EXPIRY_MS)

    const wave = await prisma.$transaction(async (tx) => {
      const w = await tx.waveActivity.create({
        data: {
          creatorId: dbUser.id,
          activityType: activityType as WaveActivityType,
          area,
          thought: thought?.trim() || null,
          locationName: locationName || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          expiresAt,
        },
      })

      // Creator is the first participant
      await tx.waveParticipant.create({
        data: {
          waveActivityId: w.id,
          userId: dbUser.id,
        },
      })

      return w
    })

    return NextResponse.json({ wave, participantCount: 1 }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  const type = searchParams.get('type')
  const radiusKm = parseFloat(searchParams.get('radius') || String(DEFAULT_RADIUS_KM))

  // Validate type if provided
  if (type && !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Get blocked user IDs to filter them out
  const blockedUserIds = await getBlockedUserIds(userId)

  const now = new Date()

  // Build where clause
  const where: Record<string, unknown> = {
    expiresAt: { gt: now },
  }
  if (type) {
    where.activityType = type
  }
  // Filter out waves from blocked users
  if (blockedUserIds.size > 0) {
    where.creatorId = { notIn: Array.from(blockedUserIds) }
  }

  // --- Fetch hosted activities (published, with coordinates, upcoming) ---
  // Show all future activities with no date ceiling
  const hostedActivities = await prisma.activity.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
      latitude: { not: 0 },
      longitude: { not: 0 },
      OR: [
        // Has end time - must be in the future
        { endTime: { gte: now } },
        // No end time but has start time - must be upcoming (with 3 hour buffer for in-progress events)
        {
          endTime: null,
          startTime: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
        },
        // No specific time - always show
        { startTime: null, endTime: null },
      ],
    },
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { userActivities: true } },
    },
    orderBy: { startTime: 'asc' }, // Soonest first
    take: 100,
  })

  // --- Fetch upcoming EventSubmissions ---
  // Show: recurring events (always) + all future one-time events
  // Add 3 hour buffer after eventDate to account for event duration
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const eventSubmissions = await prisma.eventSubmission.findMany({
    where: {
      status: 'APPROVED',
      AND: [
        {
          OR: [
            { scheduledPublishAt: null },
            { scheduledPublishAt: { lte: now } },
          ],
        },
        {
          OR: [
            { recurring: true },
            { eventDate: { gte: threeHoursAgo } },
          ],
        },
      ],
    },
    select: {
      id: true,
      eventName: true,
      description: true,
      category: true,
      location: true,
      latitude: true,
      longitude: true,
      eventDate: true,
      day: true,
      time: true,
      imageUrl: true,
      isFree: true,
      price: true,
      organizerName: true,
      organizerInstagram: true,
      recurring: true,
      maxTickets: true,
      ticketsSold: true,
      isFull: true,
    },
    orderBy: { eventDate: 'asc' }, // Soonest first
    take: 100,
  })

  // Get attendance counts for social proof
  const eventIds = eventSubmissions.map((e) => e.id)
  const attendanceCounts = eventIds.length > 0
    ? await prisma.eventAttendance.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { id: true },
      })
    : []
  const attendanceMap = new Map(attendanceCounts.map((a) => [a.eventId, a._count.id]))

  // Use shared Singapore timezone helpers for all date calculations
  const today = getSGToday()

  // Convert EventSubmissions with engagement signals
  const eventSubmissionData = eventSubmissions.map((e) => {
    const goingCount = attendanceMap.get(e.id) || 0
    const totalGoing = goingCount + (e.ticketsSold || 0) // Include both attendance RSVPs and ticket sales
    const spotsLeft = e.maxTickets ? Math.max(0, e.maxTickets - totalGoing) : null

    // For recurring events, always calculate next occurrence from day name
    const effectiveDate = e.recurring
      ? getNextOccurrenceSG(e.day) ?? e.eventDate
      : e.eventDate

    // Combine date with time string to get proper startTime
    const startTime = combineDateTimeSG(effectiveDate, e.time)

    return {
      id: `event_${e.id}`,
      title: e.eventName,
      description: e.description,
      categorySlug: e.category.toLowerCase().replace(/[^a-z]/g, '-'),
      type: e.category,
      city: '',
      latitude: e.latitude ?? null,
      longitude: e.longitude ?? null,
      address: e.location,
      startTime: startTime,
      endTime: null,
      maxPeople: e.maxTickets,
      imageUrl: e.imageUrl,
      price: e.isFree ? 0 : (e.price || 0) / 100,
      currency: 'SGD',
      participantCount: goingCount,
      hostName: e.organizerName,
      hostImageUrl: null,
      hostId: `organizer_${e.organizerInstagram}`,
      isEventSubmission: true,
      recurring: e.recurring,
      eventTime: e.time,
      // Engagement signals
      isHappeningToday: isTodaySG(effectiveDate),
      isThisWeekend: isThisWeekendSG(effectiveDate),
      spotsLeft,
      isFull: e.isFull || (spotsLeft !== null && spotsLeft <= 0),
    }
  })

  // Map Activities with engagement signals
  const activityData = hostedActivities.map((a) => {
    const spotsLeft = a.maxPeople ? Math.max(0, a.maxPeople - a._count.userActivities) : null
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      categorySlug: a.categorySlug,
      type: a.type,
      city: a.city,
      latitude: a.latitude,
      longitude: a.longitude,
      address: a.address,
      startTime: a.startTime,
      endTime: a.endTime,
      maxPeople: a.maxPeople,
      imageUrl: a.imageUrl,
      price: a.price,
      currency: a.currency,
      participantCount: a._count.userActivities,
      hostName: a.user.name,
      hostImageUrl: a.user.imageUrl,
      hostId: a.user.id,
      // Engagement signals
      isHappeningToday: isTodaySG(a.startTime),
      isThisWeekend: isThisWeekendSG(a.startTime),
      spotsLeft,
      isFull: spotsLeft !== null && spotsLeft <= 0,
    }
  })

  // Combine and sort: Today first, then weekend, then by date, then by popularity
  const hostedData = [...activityData, ...eventSubmissionData].sort((a, b) => {
    // Today's events get top priority
    if (a.isHappeningToday && !b.isHappeningToday) return -1
    if (!a.isHappeningToday && b.isHappeningToday) return 1

    // Weekend events get second priority
    if (a.isThisWeekend && !b.isThisWeekend) return -1
    if (!a.isThisWeekend && b.isThisWeekend) return 1

    // Then by start date (soonest first)
    const aDate = a.startTime ? new Date(a.startTime).getTime() : Infinity
    const bDate = b.startTime ? new Date(b.startTime).getTime() : Infinity
    if (aDate !== bDate) return aDate - bDate

    // Finally by popularity (most attendees first)
    return (b.participantCount || 0) - (a.participantCount || 0)
  })

  // If lat/lng provided, use Haversine raw query
  if (!isNaN(lat) && !isNaN(lng)) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }
    const clampedRadius = Math.min(Math.max(radiusKm, 0.1), 50)

    // Build parameterized query — type filter uses separate param if present
    const params: (number | string | string[])[] = [lat, lng, clampedRadius]
    let typeClause = ''
    let blockedClause = ''
    if (type) {
      params.push(type)
      typeClause = `AND wa."activityType" = $${params.length}::text::"WaveActivityType"`
    }
    if (blockedUserIds.size > 0) {
      params.push(Array.from(blockedUserIds))
      blockedClause = `AND wa."creatorId" != ALL($${params.length}::text[])`
    }

    const waves = await prisma.$queryRawUnsafe<
      Array<{
        id: string
        creatorId: string
        activityType: string
        area: string
        locationName: string | null
        latitude: number | null
        longitude: number | null
        scheduledFor: Date | null
        waveThreshold: number
        isUnlocked: boolean
        startedAt: Date
        expiresAt: Date
        chatId: string | null
        thought: string | null
        participantCount: bigint
        distanceKm: number | null
        creatorName: string | null
        creatorImageUrl: string | null
      }>
    >(`
      SELECT
        wa.id, wa."creatorId", wa."activityType", wa.area, wa."locationName",
        wa.latitude, wa.longitude, wa."scheduledFor", wa."waveThreshold",
        wa."isUnlocked", wa."startedAt", wa."expiresAt", wa."chatId", wa.thought,
        (SELECT COUNT(*) FROM wave_participants wp WHERE wp."waveActivityId" = wa.id) AS "participantCount",
        CASE WHEN wa.latitude IS NOT NULL AND wa.longitude IS NOT NULL THEN
          (6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians($1)) * cos(radians(wa.latitude)) *
            cos(radians(wa.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(wa.latitude))
          ))))
        ELSE NULL END AS "distanceKm",
        u.name AS "creatorName",
        u."imageUrl" AS "creatorImageUrl"
      FROM wave_activities wa
      JOIN users u ON u.id = wa."creatorId"
      WHERE wa."expiresAt" > NOW()
        ${typeClause}
        ${blockedClause}
        AND (
          wa.latitude IS NULL OR wa.longitude IS NULL OR
          (6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians($1)) * cos(radians(wa.latitude)) *
            cos(radians(wa.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(wa.latitude))
          )))) <= $3
        )
      ORDER BY wa."startedAt" DESC
      LIMIT 50
    `, ...params)

    return NextResponse.json({
      waves: waves.map((w) => ({
        ...w,
        participantCount: Number(w.participantCount),
      })),
      hostedActivities: hostedData,
    })
  }

  // Fallback: no location filter
  const waves = await prisma.waveActivity.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    waves: waves.map((w) => ({
      id: w.id,
      creatorId: w.creatorId,
      activityType: w.activityType,
      area: w.area,
      locationName: w.locationName,
      latitude: w.latitude,
      longitude: w.longitude,
      scheduledFor: w.scheduledFor,
      waveThreshold: w.waveThreshold,
      isUnlocked: w.isUnlocked,
      startedAt: w.startedAt,
      expiresAt: w.expiresAt,
      chatId: w.chatId,
      thought: w.thought,
      participantCount: w._count.participants,
      distanceKm: null,
      creatorName: w.creator.name,
      creatorImageUrl: w.creator.imageUrl,
    })),
    hostedActivities: hostedData,
  })
}
