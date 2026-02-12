import { prisma } from '@/lib/prisma'
import { getSGNow } from '@/lib/event-dates'

// ─── Types ──────────────────────────────────────────────────────────

type TimeSlot = 'morning' | 'afternoon' | 'evening'

interface UserPreferenceProfile {
  categoryWeights: Map<string, number>
  preferredDays: string[]
  preferredTimeSlots: TimeSlot[]
  frequentAreas: string[]
}

export interface RecommendedEvent {
  id: string
  title: string
  category: string | null
  date: string | null
  time: string | null
  location: string | null
  imageUrl: string | null
  score: number
  source: 'activity' | 'event_submission'
}

// ─── Helpers ────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()]
}

function classifyTimeSlot(date: Date): TimeSlot
function classifyTimeSlot(timeStr: string): TimeSlot
function classifyTimeSlot(input: Date | string): TimeSlot {
  let hours: number

  if (input instanceof Date) {
    hours = input.getHours()
  } else {
    const match = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!match) return 'morning'
    hours = parseInt(match[1], 10)
    const period = match[3]?.toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
  }

  if (hours < 12) return 'morning'
  if (hours < 17) return 'afternoon'
  return 'evening'
}

/** Normalize a category weight map so the max value is 1. */
function normalizeWeights(weights: Map<string, number>): Map<string, number> {
  const max = Math.max(...weights.values(), 1)
  const normalized = new Map<string, number>()
  for (const [key, value] of weights) {
    normalized.set(key, value / max)
  }
  return normalized
}

/** How many days ago a date was created (capped at 30 for scoring). */
function daysSinceCreation(createdAt: Date): number {
  const now = getSGNow()
  const diff = now.getTime() - createdAt.getTime()
  return Math.min(Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0), 30)
}

// ─── Core Functions ─────────────────────────────────────────────────

/**
 * Build a preference profile from a user's past event participation history.
 */
export async function buildUserPreferenceProfile(
  userId: string,
  userEmail: string,
): Promise<UserPreferenceProfile> {
  // 1. Activity-based history (UserActivity JOINED/COMPLETED -> Activity details)
  const activityHistory = await prisma.userActivity.findMany({
    where: {
      userId,
      status: { in: ['JOINED', 'COMPLETED'] },
    },
    include: {
      activity: {
        select: {
          categorySlug: true,
          city: true,
          startTime: true,
        },
      },
    },
  })

  // 2. EventAttendance-based history (email match -> EventSubmission via eventId)
  const attendanceHistory = await prisma.eventAttendance.findMany({
    where: { email: userEmail },
    select: { eventId: true, timestamp: true },
  })

  // Fetch related EventSubmissions for attendance records
  const attendedEventIds = attendanceHistory.map((a) => a.eventId)
  const attendedSubmissions =
    attendedEventIds.length > 0
      ? await prisma.eventSubmission.findMany({
          where: { id: { in: attendedEventIds } },
          select: {
            id: true,
            category: true,
            location: true,
            day: true,
            eventDate: true,
            time: true,
          },
        })
      : []

  const submissionMap = new Map(attendedSubmissions.map((s) => [s.id, s]))

  // ─── Extract category weights ───
  const categoryCounts = new Map<string, number>()

  for (const ua of activityHistory) {
    const cat = ua.activity.categorySlug
    if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }

  for (const att of attendanceHistory) {
    const sub = submissionMap.get(att.eventId)
    if (sub?.category) {
      categoryCounts.set(sub.category, (categoryCounts.get(sub.category) ?? 0) + 1)
    }
  }

  const categoryWeights = normalizeWeights(categoryCounts)

  // ─── Extract preferred days ───
  const dayCounts = new Map<string, number>()

  for (const ua of activityHistory) {
    if (ua.activity.startTime) {
      const day = getDayName(ua.activity.startTime)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
  }

  for (const att of attendanceHistory) {
    const sub = submissionMap.get(att.eventId)
    if (sub?.eventDate) {
      const day = getDayName(sub.eventDate)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    } else if (sub?.day) {
      // Parse recurring day field like "Saturdays" -> "Saturday"
      const cleaned = sub.day.replace(/s$/, '').replace(/^Every\s+/i, '')
      const matched = DAY_NAMES.find((d) => d.toLowerCase().startsWith(cleaned.toLowerCase().slice(0, 3)))
      if (matched) dayCounts.set(matched, (dayCounts.get(matched) ?? 0) + 1)
    }
  }

  // Top days (those appearing at least once, sorted by frequency)
  const preferredDays = [...dayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([day]) => day)

  // ─── Extract preferred time slots ───
  const slotCounts = new Map<TimeSlot, number>()

  for (const ua of activityHistory) {
    if (ua.activity.startTime) {
      const slot = classifyTimeSlot(ua.activity.startTime)
      slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1)
    }
  }

  for (const att of attendanceHistory) {
    const sub = submissionMap.get(att.eventId)
    if (sub?.time) {
      const slot = classifyTimeSlot(sub.time)
      slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1)
    }
  }

  const preferredTimeSlots = [...slotCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slot]) => slot)

  // ─── Extract frequent areas ───
  const areaCounts = new Map<string, number>()

  for (const ua of activityHistory) {
    const city = ua.activity.city
    if (city) areaCounts.set(city, (areaCounts.get(city) ?? 0) + 1)
  }

  for (const att of attendanceHistory) {
    const sub = submissionMap.get(att.eventId)
    if (sub?.location) areaCounts.set(sub.location, (areaCounts.get(sub.location) ?? 0) + 1)
  }

  const frequentAreas = [...areaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area)

  return { categoryWeights, preferredDays, preferredTimeSlots, frequentAreas }
}

/**
 * Get personalized event recommendations for a user.
 */
export async function getRecommendedEvents(
  userId: string,
  userEmail: string,
  limit = 10,
): Promise<RecommendedEvent[]> {
  const now = getSGNow()

  // Fetch upcoming events from both systems in parallel
  const [upcomingActivities, upcomingSubmissions, profile] = await Promise.all([
    prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        startTime: { gt: now },
      },
      select: {
        id: true,
        title: true,
        categorySlug: true,
        city: true,
        startTime: true,
        imageUrl: true,
        address: true,
        createdAt: true,
        _count: { select: { userActivities: { where: { status: 'JOINED' } } } },
      },
    }),
    prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        isFull: false,
        OR: [
          { eventDate: { gt: now } },
          { recurring: true },
        ],
      },
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        imageUrl: true,
        recurring: true,
        createdAt: true,
      },
    }),
    buildUserPreferenceProfile(userId, userEmail),
  ])

  // Build sets of events the user is already attending
  const [joinedActivities, attendedSubmissions] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId, status: { in: ['JOINED', 'INTERESTED'] } },
      select: { activityId: true },
    }),
    prisma.eventAttendance.findMany({
      where: { email: userEmail },
      select: { eventId: true },
    }),
  ])

  const joinedActivityIds = new Set(joinedActivities.map((a) => a.activityId))
  const attendedEventIds = new Set(attendedSubmissions.map((a) => a.eventId))

  // Get attendance counts for event submissions (for popularity scoring)
  const submissionIds = upcomingSubmissions.map((s) => s.id)
  const submissionAttendanceCounts =
    submissionIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          where: { eventId: { in: submissionIds } },
          _count: { id: true },
        })
      : []

  const submissionCountMap = new Map(
    submissionAttendanceCounts.map((c) => [c.eventId, c._count.id]),
  )

  // Find max popularity values for normalization
  const maxActivityPopularity = Math.max(
    ...upcomingActivities.map((a) => a._count.userActivities),
    1,
  )
  const maxSubmissionPopularity = Math.max(
    ...submissionIds.map((id) => submissionCountMap.get(id) ?? 0),
    1,
  )

  // ─── Score activities ───
  const scoredEvents: RecommendedEvent[] = []

  for (const activity of upcomingActivities) {
    if (joinedActivityIds.has(activity.id)) continue

    let score = 0

    // Category match (35pts)
    if (activity.categorySlug && profile.categoryWeights.has(activity.categorySlug)) {
      score += 35 * (profile.categoryWeights.get(activity.categorySlug) ?? 0)
    }

    // Day preference (10pts)
    if (activity.startTime) {
      const dayName = getDayName(activity.startTime)
      if (profile.preferredDays.includes(dayName)) {
        const dayRank = profile.preferredDays.indexOf(dayName)
        score += 10 * Math.max(0, 1 - dayRank * 0.2)
      }
    }

    // Time preference (15pts)
    if (activity.startTime) {
      const slot = classifyTimeSlot(activity.startTime)
      if (profile.preferredTimeSlots.includes(slot)) {
        const slotRank = profile.preferredTimeSlots.indexOf(slot)
        score += 15 * Math.max(0, 1 - slotRank * 0.3)
      }
    }

    // Location proximity (20pts)
    if (activity.city && profile.frequentAreas.includes(activity.city)) {
      const areaRank = profile.frequentAreas.indexOf(activity.city)
      score += 20 * Math.max(0, 1 - areaRank * 0.2)
    }

    // Popularity (10pts)
    const popularity = activity._count.userActivities
    score += 10 * (popularity / maxActivityPopularity)

    // Recency/freshness (10pts) - newer events score higher
    const age = daysSinceCreation(activity.createdAt)
    score += 10 * Math.max(0, 1 - age / 30)

    scoredEvents.push({
      id: activity.id,
      title: activity.title,
      category: activity.categorySlug,
      date: activity.startTime?.toISOString() ?? null,
      time: activity.startTime?.toISOString() ?? null,
      location: activity.address ?? activity.city,
      imageUrl: activity.imageUrl,
      score: Math.round(score),
      source: 'activity',
    })
  }

  // ─── Score event submissions ───
  for (const sub of upcomingSubmissions) {
    if (attendedEventIds.has(sub.id)) continue

    let score = 0

    // Category match (35pts)
    if (sub.category && profile.categoryWeights.has(sub.category)) {
      score += 35 * (profile.categoryWeights.get(sub.category) ?? 0)
    }

    // Day preference (10pts)
    if (sub.eventDate) {
      const dayName = getDayName(sub.eventDate)
      if (profile.preferredDays.includes(dayName)) {
        const dayRank = profile.preferredDays.indexOf(dayName)
        score += 10 * Math.max(0, 1 - dayRank * 0.2)
      }
    } else if (sub.day) {
      const cleaned = sub.day.replace(/s$/, '').replace(/^Every\s+/i, '')
      const matched = DAY_NAMES.find((d) => d.toLowerCase().startsWith(cleaned.toLowerCase().slice(0, 3)))
      if (matched && profile.preferredDays.includes(matched)) {
        const dayRank = profile.preferredDays.indexOf(matched)
        score += 10 * Math.max(0, 1 - dayRank * 0.2)
      }
    }

    // Time preference (15pts)
    if (sub.time) {
      const slot = classifyTimeSlot(sub.time)
      if (profile.preferredTimeSlots.includes(slot)) {
        const slotRank = profile.preferredTimeSlots.indexOf(slot)
        score += 15 * Math.max(0, 1 - slotRank * 0.3)
      }
    }

    // Location proximity (20pts)
    if (sub.location && profile.frequentAreas.includes(sub.location)) {
      const areaRank = profile.frequentAreas.indexOf(sub.location)
      score += 20 * Math.max(0, 1 - areaRank * 0.2)
    }

    // Popularity (10pts)
    const popularity = submissionCountMap.get(sub.id) ?? 0
    score += 10 * (popularity / maxSubmissionPopularity)

    // Recency/freshness (10pts)
    const age = daysSinceCreation(sub.createdAt)
    score += 10 * Math.max(0, 1 - age / 30)

    scoredEvents.push({
      id: sub.id,
      title: sub.eventName,
      category: sub.category,
      date: sub.eventDate?.toISOString() ?? sub.day,
      time: sub.time,
      location: sub.location,
      imageUrl: sub.imageUrl,
      score: Math.round(score),
      source: 'event_submission',
    })
  }

  // Sort by score descending, return limited results
  scoredEvents.sort((a, b) => b.score - a.score)
  return scoredEvents.slice(0, limit)
}

/**
 * Get trending events based on highest attendance in the last 7 days.
 */
export async function getTrendingEvents(limit = 5): Promise<RecommendedEvent[]> {
  const now = getSGNow()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get attendance counts from both systems in the last 7 days
  const [submissionTrending, activityTrending] = await Promise.all([
    prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { timestamp: { gte: sevenDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit * 2, // fetch extra for merging
    }),
    prisma.userActivity.groupBy({
      by: ['activityId'],
      where: {
        status: 'JOINED',
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit * 2,
    }),
  ])

  // Fetch full details for trending items
  const trendingSubmissionIds = submissionTrending.map((t) => t.eventId)
  const trendingActivityIds = activityTrending.map((t) => t.activityId)

  const [trendingSubmissions, trendingActivities] = await Promise.all([
    trendingSubmissionIds.length > 0
      ? prisma.eventSubmission.findMany({
          where: {
            id: { in: trendingSubmissionIds },
            status: 'APPROVED',
            isFull: false,
            OR: [
              { eventDate: { gt: now } },
              { recurring: true },
            ],
          },
          select: {
            id: true,
            eventName: true,
            category: true,
            day: true,
            eventDate: true,
            time: true,
            location: true,
            imageUrl: true,
          },
        })
      : [],
    trendingActivityIds.length > 0
      ? prisma.activity.findMany({
          where: {
            id: { in: trendingActivityIds },
            status: 'PUBLISHED',
            deletedAt: null,
            startTime: { gt: now },
          },
          select: {
            id: true,
            title: true,
            categorySlug: true,
            city: true,
            startTime: true,
            imageUrl: true,
            address: true,
          },
        })
      : [],
  ])

  // Build count maps
  const submissionCountMap = new Map(submissionTrending.map((t) => [t.eventId, t._count.id]))
  const activityCountMap = new Map(activityTrending.map((t) => [t.activityId, t._count.id]))

  // Merge into unified results with attendance count for sorting
  const results: (RecommendedEvent & { _attendanceCount: number; _sortDate: Date | null })[] = []

  for (const sub of trendingSubmissions) {
    results.push({
      id: sub.id,
      title: sub.eventName,
      category: sub.category,
      date: sub.eventDate?.toISOString() ?? sub.day,
      time: sub.time,
      location: sub.location,
      imageUrl: sub.imageUrl,
      score: 0,
      source: 'event_submission',
      _attendanceCount: submissionCountMap.get(sub.id) ?? 0,
      _sortDate: sub.eventDate,
    })
  }

  for (const act of trendingActivities) {
    results.push({
      id: act.id,
      title: act.title,
      category: act.categorySlug,
      date: act.startTime?.toISOString() ?? null,
      time: act.startTime?.toISOString() ?? null,
      location: act.address ?? act.city,
      imageUrl: act.imageUrl,
      score: 0,
      source: 'activity',
      _attendanceCount: activityCountMap.get(act.id) ?? 0,
      _sortDate: act.startTime ?? null,
    })
  }

  // Sort by attendance count desc, then by soonest date for ties
  results.sort((a, b) => {
    if (b._attendanceCount !== a._attendanceCount) {
      return b._attendanceCount - a._attendanceCount
    }
    // Soonest date first for ties
    const dateA = a._sortDate?.getTime() ?? Infinity
    const dateB = b._sortDate?.getTime() ?? Infinity
    return dateA - dateB
  })

  // Strip internal fields and return
  return results.slice(0, limit).map(({ _attendanceCount, _sortDate, ...event }) => event)
}
