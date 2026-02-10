/**
 * Interest / demand signaling utilities
 * Users can signal "I want this host to host something"
 */

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

const MILESTONE_THRESHOLDS = [5, 10, 20, 50, 100]

/**
 * Toggle interest signal for a host. Creates if not exists, deletes if exists.
 * Sends milestone notifications to the host.
 */
export async function toggleInterest(
  userId: string,
  hostId: string,
  categorySlug?: string,
  message?: string
): Promise<{ interested: boolean; count: number }> {
  const existing = await prisma.hostInterest.findUnique({
    where: {
      userId_hostId: { userId, hostId },
    },
  })

  if (existing) {
    await prisma.hostInterest.delete({
      where: { id: existing.id },
    })
    const count = await getInterestCount(hostId)
    return { interested: false, count }
  }

  await prisma.hostInterest.create({
    data: {
      userId,
      hostId,
      categorySlug: categorySlug || null,
      message: message?.slice(0, 200) || null,
    },
  })

  const count = await getInterestCount(hostId)

  // Send milestone notification to host
  if (MILESTONE_THRESHOLDS.includes(count)) {
    await createNotification({
      userId: hostId,
      type: 'SYSTEM',
      title: `${count} people want you to host!`,
      content: `You've reached ${count} interest signals. Your community is asking for more activities!`,
      link: '/host/dashboard',
      metadata: {
        type: 'interest_milestone',
        milestone: count,
      },
    })
  }

  return { interested: true, count }
}

/**
 * Get total interest count for a host
 */
export async function getInterestCount(hostId: string): Promise<number> {
  return prisma.hostInterest.count({
    where: { hostId },
  })
}

/**
 * Check if a user has signaled interest in a host
 */
export async function isInterested(
  userId: string,
  hostId: string
): Promise<boolean> {
  const interest = await prisma.hostInterest.findUnique({
    where: {
      userId_hostId: { userId, hostId },
    },
  })
  return !!interest
}

/**
 * Get interest breakdown for a host (used in demand dashboard)
 */
export async function getInterestBreakdown(hostId: string) {
  const [total, byCategory, recentSignals] = await Promise.all([
    prisma.hostInterest.count({ where: { hostId } }),
    prisma.hostInterest.groupBy({
      by: ['categorySlug'],
      where: { hostId },
      _count: { categorySlug: true },
      orderBy: { _count: { categorySlug: 'desc' } },
    }),
    prisma.hostInterest.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    }),
  ])

  return {
    total,
    byCategory: byCategory.map((item) => ({
      categorySlug: item.categorySlug,
      count: item._count.categorySlug,
    })),
    recentSignals: recentSignals.map((signal) => ({
      id: signal.id,
      categorySlug: signal.categorySlug,
      message: signal.message,
      createdAt: signal.createdAt,
      user: signal.user,
    })),
  }
}
