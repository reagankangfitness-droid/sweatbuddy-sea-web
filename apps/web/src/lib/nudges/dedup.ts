// Nudge deduplication and rate limiting

import { prisma } from '@/lib/prisma'
import type { NudgeSignalType } from './signals'

/**
 * Check if a user is eligible to receive a nudge.
 * Rules:
 * - Max 1 nudge per user per day (24h)
 * - No duplicate nudge for the same signalType + entityId within 7 days
 */
export async function checkNudgeEligibility(
  userId: string,
  nudgeType: NudgeSignalType,
  entityId?: string
): Promise<boolean> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Rate limit: max 1 nudge per user per day
  const recentNudgeCount = await prisma.notification.count({
    where: {
      userId,
      type: 'NUDGE',
      createdAt: { gt: oneDayAgo },
    },
  })

  if (recentNudgeCount > 0) return false

  // Dedup: no same nudgeType+entityId within 7 days
  if (entityId) {
    const duplicates: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE "userId" = ${userId}
        AND type = 'NUDGE'
        AND "createdAt" > ${sevenDaysAgo}
        AND metadata->>'nudgeType' = ${nudgeType}
        AND metadata->>'entityId' = ${entityId}
    `
    if (duplicates[0] && Number(duplicates[0].count) > 0) return false
  } else {
    const duplicates: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE "userId" = ${userId}
        AND type = 'NUDGE'
        AND "createdAt" > ${sevenDaysAgo}
        AND metadata->>'nudgeType' = ${nudgeType}
    `
    if (duplicates[0] && Number(duplicates[0].count) > 0) return false
  }

  return true
}
