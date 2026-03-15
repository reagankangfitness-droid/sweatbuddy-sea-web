import { prisma } from './prisma'

// Badge definitions - the source of truth for all badges
export const BADGE_DEFINITIONS = [
  // Attendance badges
  { slug: 'first-sweat', name: 'First Sweat', description: 'Completed your first session', emoji: '💧', criteria: 'Complete 1 session', threshold: 1, category: 'attendance' },
  { slug: 'regular', name: 'Regular', description: 'Completed 10 sessions', emoji: '⭐', criteria: 'Complete 10 sessions', threshold: 10, category: 'attendance' },
  { slug: 'dedicated', name: 'Dedicated', description: 'Completed 25 sessions', emoji: '🏆', criteria: 'Complete 25 sessions', threshold: 25, category: 'attendance' },
  { slug: 'legend', name: 'Legend', description: 'Completed 50 sessions', emoji: '👑', criteria: 'Complete 50 sessions', threshold: 50, category: 'attendance' },

  // Hosting badges
  { slug: 'first-host', name: 'First Host', description: 'Hosted your first session', emoji: '🎤', criteria: 'Host 1 session', threshold: 1, category: 'hosting' },
  { slug: 'community-builder', name: 'Community Builder', description: 'Hosted 10 sessions', emoji: '🏗️', criteria: 'Host 10 sessions', threshold: 10, category: 'hosting' },
  { slug: 'top-host', name: 'Top Host', description: 'Hosted 25 sessions with 4.5+ rating', emoji: '🌟', criteria: 'Host 25 sessions with 4.5+ avg rating', threshold: 25, category: 'hosting' },

  // Streak badges
  { slug: 'streak-3', name: 'On Fire', description: '3-week attendance streak', emoji: '🔥', criteria: '3 consecutive weeks with a session', threshold: 3, category: 'streak' },
  { slug: 'streak-8', name: 'Streak Master', description: '8-week attendance streak', emoji: '⚡', criteria: '8 consecutive weeks with a session', threshold: 8, category: 'streak' },

  // Social badges
  { slug: 'crew-leader', name: 'Crew Leader', description: 'Created a crew with 3+ members', emoji: '👥', criteria: 'Create a crew with 3+ members', threshold: 3, category: 'social' },
  { slug: 'explorer', name: 'Explorer', description: 'Tried 5 different activity types', emoji: '🧭', criteria: 'Attend 5 different activity types', threshold: 5, category: 'social' },
] as const

// Seed badges into database (idempotent - upserts)
export async function seedBadges() {
  const results = await Promise.all(
    BADGE_DEFINITIONS.map((badge) =>
      prisma.badge.upsert({
        where: { slug: badge.slug },
        update: {
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          criteria: badge.criteria,
          threshold: badge.threshold,
          category: badge.category,
        },
        create: {
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          criteria: badge.criteria,
          threshold: badge.threshold,
          category: badge.category,
        },
      })
    )
  )
  return results.length
}

// Check and award badges for a user (call after session completion, check-in, etc.)
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sessionsAttendedCount: true,
      sessionsHostedCount: true,
      earnedBadges: { select: { badge: { select: { slug: true } } } },
      hostRatingSummary: { select: { averageRating: true } },
    },
  })

  if (!user) return awarded

  const earnedSlugs = new Set(user.earnedBadges.map((eb) => eb.badge.slug))

  // Check attendance badges
  const attendanceBadges = BADGE_DEFINITIONS.filter(
    (b) => b.category === 'attendance'
  )
  for (const badge of attendanceBadges) {
    if (
      !earnedSlugs.has(badge.slug) &&
      user.sessionsAttendedCount >= badge.threshold
    ) {
      await awardBadge(userId, badge.slug)
      awarded.push(badge.slug)
    }
  }

  // Check explorer badge (5 different activity types)
  if (!earnedSlugs.has('explorer')) {
    const distinctTypes = await prisma.userActivity.findMany({
      where: { userId, status: { in: ['JOINED', 'COMPLETED'] }, checkedIn: true },
      select: { activity: { select: { categorySlug: true } } },
      distinct: ['activityId'],
    })
    const uniqueTypes = new Set(distinctTypes.map(ua => ua.activity.categorySlug).filter(Boolean))
    if (uniqueTypes.size >= 5) {
      await awardBadge(userId, 'explorer')
      awarded.push('explorer')
    }
  }

  // Check crew-leader badge (lead a crew with 3+ members)
  if (!earnedSlugs.has('crew-leader')) {
    const ledCrews = await prisma.crewMember.findMany({
      where: { userId, role: 'LEADER' },
      select: {
        crewRef: {
          select: {
            _count: { select: { members: true } },
          },
        },
      },
    })
    const hasQualifyingCrew = ledCrews.some(
      (cm) => cm.crewRef._count.members >= 3
    )
    if (hasQualifyingCrew) {
      await awardBadge(userId, 'crew-leader')
      awarded.push('crew-leader')
    }
  }

  // Check hosting badges
  const hostingBadges = BADGE_DEFINITIONS.filter(
    (b) => b.category === 'hosting'
  )
  for (const badge of hostingBadges) {
    if (badge.slug === 'top-host') {
      if (
        !earnedSlugs.has(badge.slug) &&
        user.sessionsHostedCount >= badge.threshold &&
        Number(user.hostRatingSummary?.averageRating ?? 0) >= 4.5
      ) {
        await awardBadge(userId, badge.slug)
        awarded.push(badge.slug)
      }
    } else {
      if (
        !earnedSlugs.has(badge.slug) &&
        user.sessionsHostedCount >= badge.threshold
      ) {
        await awardBadge(userId, badge.slug)
        awarded.push(badge.slug)
      }
    }
  }

  return awarded
}

async function awardBadge(userId: string, badgeSlug: string) {
  const badge = await prisma.badge.findUnique({ where: { slug: badgeSlug } })
  if (!badge) return

  await prisma.earnedBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id },
  })
}
