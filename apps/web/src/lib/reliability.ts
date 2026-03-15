import { prisma } from './prisma'

// Calculate reliability score for a user based on their attendance history
// Formula: (checkedInCount / totalJoinedCount) * 100
// Minimum 3 sessions before score is calculated (returns 100 for new users)
export async function calculateReliabilityScore(userId: string): Promise<number> {
  const stats = await prisma.userActivity.aggregate({
    where: {
      userId,
      status: { in: ['JOINED', 'COMPLETED'] },
    },
    _count: { id: true },
  })

  const checkedInCount = await prisma.userActivity.count({
    where: {
      userId,
      status: { in: ['JOINED', 'COMPLETED'] },
      checkedIn: true,
    },
  })

  const total = stats._count.id
  if (total < 3) return 100 // New users get benefit of doubt

  return Math.round((checkedInCount / total) * 100)
}

// Check and auto-promote host tier based on criteria
// NEW: 0 sessions
// COMMUNITY: 3+ sessions hosted, 4.0+ avg rating
// VERIFIED: 10+ sessions hosted, 4.3+ avg rating, reliabilityScore >= 90
// ANCHOR: Manual promotion only (by admin)
export async function evaluateHostTier(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hostTier: true,
      sessionsHostedCount: true,
      reliabilityScore: true,
      hostRatingSummary: { select: { averageRating: true, totalReviews: true } },
    },
  })

  if (!user) return 'NEW'
  if (user.hostTier === 'ANCHOR') return 'ANCHOR' // Never auto-demote anchors

  const avgRating = Number(user.hostRatingSummary?.averageRating ?? 0)
  const hosted = user.sessionsHostedCount

  if (hosted >= 10 && avgRating >= 4.3 && user.reliabilityScore >= 90) {
    return 'VERIFIED'
  }
  if (hosted >= 3 && avgRating >= 4.0) {
    return 'COMMUNITY'
  }
  return 'NEW'
}
