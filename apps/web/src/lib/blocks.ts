import { prisma } from '@/lib/prisma'

/**
 * Get all user IDs that should be hidden from the given user.
 * This includes users they have blocked AND users who have blocked them (bidirectional).
 */
export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: userId },      // Users this user has blocked
        { blockedUserId: userId },  // Users who have blocked this user
      ],
    },
    select: {
      blockerId: true,
      blockedUserId: true,
    },
  })

  const blockedIds = new Set<string>()
  for (const block of blocks) {
    if (block.blockerId === userId) {
      blockedIds.add(block.blockedUserId)
    } else {
      blockedIds.add(block.blockerId)
    }
  }

  return blockedIds
}

/**
 * Check if there is a block relationship between two users (either direction).
 */
export async function hasBlockRelationship(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedUserId: userId2 },
        { blockerId: userId2, blockedUserId: userId1 },
      ],
    },
  })

  return block !== null
}

/**
 * Check if a user has blocked another user (one direction only).
 */
export async function hasUserBlocked(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  const block = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedUserId: { blockerId, blockedUserId },
    },
  })

  return block !== null
}
