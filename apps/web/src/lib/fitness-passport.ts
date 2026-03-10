/**
 * Fitness Passport — streak, milestone, and activity breakdown logic
 * All stats derived from EventAttendance records matched by email.
 */

import { prisma } from '@/lib/prisma'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FitnessStats {
  totalSessions: number
  thisMonth: number
  uniqueCommunities: number
  currentStreak: number // consecutive weeks
  longestStreak: number
}

export interface Milestone {
  id: string
  label: string
  description: string
  achieved: boolean
  achievedDate?: string | null // ISO date string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
}

export interface PassportData {
  stats: FitnessStats
  milestones: Milestone[]
  categories: CategoryBreakdown[]
  memberSince: string | null // ISO date of first attendance
}

// ─── Streak Calculation ──────────────────────────────────────────────────────

/**
 * Get the ISO week number (Monday-based) for a Date.
 * Returns { year, week } to handle year boundaries correctly.
 */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const yearStart = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7)
  return { year: d.getFullYear(), week }
}

/**
 * Convert year+week to a comparable number (year * 100 + week)
 * so we can check consecutive weeks easily.
 */
function weekKey(year: number, week: number): number {
  return year * 100 + week
}

/**
 * Check if two week keys represent consecutive weeks.
 */
function areConsecutiveWeeks(a: number, b: number): boolean {
  const yearA = Math.floor(a / 100)
  const weekA = a % 100
  const yearB = Math.floor(b / 100)
  const weekB = b % 100

  // Same year, consecutive week
  if (yearA === yearB && weekB === weekA + 1) return true
  // Year boundary: last week of yearA → first week of yearB
  if (yearB === yearA + 1 && weekA >= 52 && weekB === 1) return true
  return false
}

/**
 * Calculate streak info from a set of attendance timestamps.
 * A "streak week" = any Monday–Sunday period with 1+ session.
 * Returns { current, longest }.
 */
function calculateStreaks(timestamps: Date[]): { current: number; longest: number } {
  if (timestamps.length === 0) return { current: 0, longest: 0 }

  // Get unique weeks
  const weekSet = new Set<number>()
  for (const ts of timestamps) {
    const { year, week } = getISOWeek(ts)
    weekSet.add(weekKey(year, week))
  }

  const sortedWeeks = Array.from(weekSet).sort((a, b) => a - b)

  if (sortedWeeks.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let currentRun = 1

  for (let i = 1; i < sortedWeeks.length; i++) {
    if (areConsecutiveWeeks(sortedWeeks[i - 1], sortedWeeks[i])) {
      currentRun++
      longest = Math.max(longest, currentRun)
    } else {
      currentRun = 1
    }
  }
  longest = Math.max(longest, currentRun)

  // Current streak: count backwards from the current week (or last week)
  const now = new Date()
  const { year: nowYear, week: nowWeek } = getISOWeek(now)
  const currentWeekKey = weekKey(nowYear, nowWeek)
  // Also consider last week (streak is valid if last session was this week or last week)
  const lastWeekDate = new Date(now)
  lastWeekDate.setDate(lastWeekDate.getDate() - 7)
  const { year: lwYear, week: lwWeek } = getISOWeek(lastWeekDate)
  const lastWeekKey = weekKey(lwYear, lwWeek)

  const lastSortedWeek = sortedWeeks[sortedWeeks.length - 1]

  // If last activity week is neither this week nor last week, streak is 0
  if (lastSortedWeek !== currentWeekKey && lastSortedWeek !== lastWeekKey) {
    return { current: 0, longest }
  }

  // Count backwards from the end of sorted weeks
  let current = 1
  for (let i = sortedWeeks.length - 2; i >= 0; i--) {
    if (areConsecutiveWeeks(sortedWeeks[i], sortedWeeks[i + 1])) {
      current++
    } else {
      break
    }
  }

  return { current, longest }
}

// ─── Milestones ──────────────────────────────────────────────────────────────

interface MilestoneInput {
  totalSessions: number
  currentStreak: number
  uniqueCategories: number
  maxCommunityCount: number // most sessions with a single community
  timestamps: Date[]
}

function computeMilestones(input: MilestoneInput): Milestone[] {
  const { totalSessions, currentStreak, uniqueCategories, maxCommunityCount, timestamps } = input

  const firstDate = timestamps.length > 0
    ? new Date(Math.min(...timestamps.map(t => t.getTime()))).toISOString().split('T')[0]
    : null

  const milestones: Milestone[] = [
    {
      id: 'first-session',
      label: 'First Sweat',
      description: 'Attend your first session',
      achieved: totalSessions >= 1,
      achievedDate: firstDate,
      tier: 'bronze',
    },
    {
      id: 'getting-started',
      label: 'Getting Started',
      description: 'Attend 5 sessions',
      achieved: totalSessions >= 5,
      achievedDate: totalSessions >= 5 ? getNthTimestamp(timestamps, 5) : null,
      tier: 'bronze',
    },
    {
      id: 'regular',
      label: 'Regular',
      description: 'Attend 10 sessions',
      achieved: totalSessions >= 10,
      achievedDate: totalSessions >= 10 ? getNthTimestamp(timestamps, 10) : null,
      tier: 'silver',
    },
    {
      id: 'committed',
      label: 'Committed',
      description: 'Attend 25 sessions',
      achieved: totalSessions >= 25,
      achievedDate: totalSessions >= 25 ? getNthTimestamp(timestamps, 25) : null,
      tier: 'gold',
    },
    {
      id: 'veteran',
      label: 'Veteran',
      description: 'Attend 50 sessions',
      achieved: totalSessions >= 50,
      achievedDate: totalSessions >= 50 ? getNthTimestamp(timestamps, 50) : null,
      tier: 'platinum',
    },
    {
      id: 'streak-4',
      label: 'On Fire',
      description: '4-week streak',
      achieved: currentStreak >= 4,
      achievedDate: null, // no exact date for streaks
      tier: 'silver',
    },
    {
      id: 'explorer',
      label: 'Explorer',
      description: 'Try 3+ categories',
      achieved: uniqueCategories >= 3,
      achievedDate: null,
      tier: 'silver',
    },
    {
      id: 'community-builder',
      label: 'Community Builder',
      description: '10+ sessions with one community',
      achieved: maxCommunityCount >= 10,
      achievedDate: null,
      tier: 'gold',
    },
  ]

  return milestones
}

function getNthTimestamp(timestamps: Date[], n: number): string | null {
  if (timestamps.length < n) return null
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime())
  return sorted[n - 1].toISOString().split('T')[0]
}

// ─── Main Functions ──────────────────────────────────────────────────────────

/**
 * Get full Fitness Passport data for a user by email.
 */
export async function getPassportData(email: string): Promise<PassportData> {
  const normalizedEmail = email.toLowerCase()

  // Get all confirmed attendance records with their event details
  const attendances = await prisma.eventAttendance.findMany({
    where: {
      email: { equals: normalizedEmail, mode: 'insensitive' },
      confirmed: true,
    },
    select: {
      eventId: true,
      eventName: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  })

  if (attendances.length === 0) {
    return {
      stats: {
        totalSessions: 0,
        thisMonth: 0,
        uniqueCommunities: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      milestones: computeMilestones({
        totalSessions: 0,
        currentStreak: 0,
        uniqueCategories: 0,
        maxCommunityCount: 0,
        timestamps: [],
      }),
      categories: [],
      memberSince: null,
    }
  }

  const timestamps = attendances.map(a => a.timestamp)
  const eventIds = [...new Set(attendances.map(a => a.eventId))]

  // Get event details for category and organizer breakdown
  const events = await prisma.eventSubmission.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      category: true,
      organizerInstagram: true,
    },
  })

  const eventMap = new Map(events.map(e => [e.id, e]))

  // Category counts
  const categoryCounts = new Map<string, number>()
  // Community counts (by organizer instagram)
  const communityCounts = new Map<string, number>()

  for (const att of attendances) {
    const event = eventMap.get(att.eventId)
    if (event) {
      const cat = event.category || 'Other'
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      const org = event.organizerInstagram.toLowerCase().replace(/^@/, '')
      communityCounts.set(org, (communityCounts.get(org) || 0) + 1)
    }
  }

  // This month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth = timestamps.filter(t => t >= startOfMonth).length

  // Streaks
  const { current: currentStreak, longest: longestStreak } = calculateStreaks(timestamps)

  // Category breakdown
  const totalSessions = attendances.length
  const categories: CategoryBreakdown[] = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalSessions) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const uniqueCommunities = communityCounts.size
  const maxCommunityCount = communityCounts.size > 0
    ? Math.max(...communityCounts.values())
    : 0

  const stats: FitnessStats = {
    totalSessions,
    thisMonth,
    uniqueCommunities,
    currentStreak,
    longestStreak,
  }

  const milestones = computeMilestones({
    totalSessions,
    currentStreak,
    uniqueCategories: categoryCounts.size,
    maxCommunityCount,
    timestamps,
  })

  const memberSince = timestamps[0]?.toISOString().split('T')[0] || null

  return { stats, milestones, categories, memberSince }
}

/**
 * Get lightweight passport stats only (for profile cards / compact views).
 */
export async function getPassportStats(email: string): Promise<FitnessStats> {
  const data = await getPassportData(email)
  return data.stats
}

/**
 * Get passport data for a public profile (by userId).
 * Respects privacy: only returns data if user has showStats enabled.
 */
export async function getPublicPassportData(userId: string): Promise<PassportData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isPublic: true, showStats: true },
  })

  if (!user || !user.isPublic || !user.showStats) return null

  return getPassportData(user.email)
}
