import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_TYPE_MAP } from '@/lib/activity-types'

export const dynamic = 'force-dynamic'

/**
 * Helper: get the Monday 00:00 of the week containing `date` (Mon-Sun weeks).
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1 // days since Monday
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get user stats and profile info for profile page
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({
        totalAttended: 0,
        thisMonth: 0,
        upcoming: 0,
        wavesThisMonth: 0,
        crewsJoined: 0,
        profile: null,
        // New streak/badge fields
        totalSessions: 0,
        weeklyStreak: 0,
        favoriteActivity: null,
        memberSince: null,
        badges: buildBadges(0, 0, false),
      })
    }

    // Get user profile from database
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        slug: true,
        isHost: true,
        name: true,
        username: true,
        createdAt: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({
        totalAttended: 0,
        thisMonth: 0,
        upcoming: 0,
        wavesThisMonth: 0,
        crewsJoined: 0,
        profile: null,
        totalSessions: 0,
        weeklyStreak: 0,
        favoriteActivity: null,
        memberSince: null,
        badges: buildBadges(0, 0, false),
      })
    }

    // ──────────────────────────────────────────────
    // Legacy stats (kept for backward compat)
    // ──────────────────────────────────────────────
    const wavesThisMonth = 0
    const crewsJoined = 0
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const attendances = await prisma.eventAttendance.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { eventId: true },
    })
    const eventIds = attendances.map(a => a.eventId)

    let totalAttended = 0
    let thisMonth = 0
    let upcoming = 0

    if (eventIds.length > 0) {
      const events = await prisma.eventSubmission.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, eventDate: true, recurring: true, day: true },
      })

      events.forEach(event => {
        if (event.eventDate) {
          const eventDate = new Date(event.eventDate)
          if (eventDate < now) {
            totalAttended++
            if (eventDate >= startOfMonth) thisMonth++
          } else {
            upcoming++
            if (eventDate >= startOfMonth && eventDate <= new Date(now.getFullYear(), now.getMonth() + 1, 0)) {
              thisMonth++
            }
          }
        } else if (event.recurring) {
          totalAttended++
          upcoming++
          thisMonth++
        }
      })
    }

    // ──────────────────────────────────────────────
    // New: Streaks, favorite activity, badges
    // ──────────────────────────────────────────────

    // Fetch all sessions the user joined/completed, with activity start time + category
    const userActivities = await prisma.userActivity.findMany({
      where: {
        userId: dbUser.id,
        status: { in: ['JOINED', 'COMPLETED'] },
        deletedAt: null,
      },
      select: {
        activity: {
          select: {
            startTime: true,
            categorySlug: true,
          },
        },
      },
    })

    const totalSessions = userActivities.length

    // Weekly streak: consecutive Mon-Sun weeks with at least 1 session
    const currentWeekStart = getWeekStart(now)
    const weekSet = new Set<string>()
    let hasEarlyBird = false

    for (const ua of userActivities) {
      const st = ua.activity.startTime
      if (st) {
        const ws = getWeekStart(new Date(st))
        weekSet.add(ws.toISOString())
        // Early bird: session starting before 8am
        const hour = new Date(st).getHours()
        if (hour < 8) hasEarlyBird = true
      }
    }

    let weeklyStreak = 0
    const checkWeek = new Date(currentWeekStart)
    // If current week has no sessions yet, start from last week
    if (!weekSet.has(checkWeek.toISOString())) {
      checkWeek.setDate(checkWeek.getDate() - 7)
    }
    while (weekSet.has(checkWeek.toISOString())) {
      weeklyStreak++
      checkWeek.setDate(checkWeek.getDate() - 7)
    }

    // Favorite activity: mode of categorySlug
    const slugCounts: Record<string, number> = {}
    for (const ua of userActivities) {
      const slug = ua.activity.categorySlug
      if (slug) {
        slugCounts[slug] = (slugCounts[slug] || 0) + 1
      }
    }
    let favoriteActivity: { slug: string; emoji: string; label: string } | null = null
    let maxCount = 0
    for (const [slug, count] of Object.entries(slugCounts)) {
      if (count > maxCount) {
        maxCount = count
        const config = ACTIVITY_TYPE_MAP[slug]
        favoriteActivity = {
          slug,
          emoji: config?.emoji ?? '🏃',
          label: config?.label ?? slug,
        }
      }
    }

    const badges = buildBadges(totalSessions, weeklyStreak, hasEarlyBird)

    return NextResponse.json({
      // Legacy fields
      totalAttended,
      thisMonth,
      upcoming,
      wavesThisMonth,
      crewsJoined,
      profile: {
        slug: dbUser.slug,
        isHost: dbUser.isHost,
        username: dbUser.username,
      },
      // New fields
      totalSessions,
      weeklyStreak,
      favoriteActivity,
      memberSince: dbUser.createdAt.toISOString(),
      badges,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────
// Badge definitions
// ──────────────────────────────────────────────
function buildBadges(totalSessions: number, weeklyStreak: number, hasEarlyBird: boolean) {
  return [
    { id: 'first', name: 'First Timer', emoji: '🎯', earned: totalSessions >= 1 },
    { id: 'regular', name: 'Regular', emoji: '🔄', earned: totalSessions >= 5 },
    { id: 'dedicated', name: 'Dedicated', emoji: '💪', earned: totalSessions >= 10 },
    { id: 'veteran', name: 'Veteran', emoji: '⭐', earned: totalSessions >= 25 },
    { id: 'centurion', name: 'Centurion', emoji: '🏆', earned: totalSessions >= 100 },
    { id: 'streak3', name: '3-Week Streak', emoji: '🔥', earned: weeklyStreak >= 3 },
    { id: 'streak8', name: '8-Week Streak', emoji: '⚡', earned: weeklyStreak >= 8 },
    { id: 'earlybird', name: 'Early Bird', emoji: '🌅', earned: hasEarlyBird },
  ]
}
