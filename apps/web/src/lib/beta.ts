import { prisma } from '@/lib/prisma'
import { customAlphabet } from 'nanoid'

// Generate URL-safe, uppercase alphanumeric codes
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/**
 * Check if beta mode is active
 */
export async function isBetaActive(): Promise<boolean> {
  const settings = await prisma.betaSettings.findUnique({
    where: { id: 1 },
  })
  return settings?.isBetaActive ?? true
}

/**
 * Get beta stats for display
 */
export async function getBetaStats() {
  const settings = await prisma.betaSettings.findUnique({
    where: { id: 1 },
  })

  const maxUsers = settings?.maxBetaUsers ?? 500
  const currentUsers = settings?.currentBetaUsers ?? 0

  return {
    isActive: settings?.isBetaActive ?? true,
    maxUsers,
    currentUsers,
    spotsRemaining: Math.max(0, maxUsers - currentUsers),
    invitesPerUser: settings?.invitesPerUser ?? 3,
    showSpotsRemaining: settings?.showSpotsRemaining ?? true,
    showWaitlistPosition: settings?.showWaitlistPosition ?? true,
  }
}

/**
 * Generate a unique invite code
 */
export function generateInviteCode(): string {
  return generateCode()
}

/**
 * Validate an invite code without using it
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean
  error?: string
  code?: any
  spotsRemaining?: number
}> {
  if (!code) {
    return { valid: false, error: 'Code is required' }
  }

  const normalizedCode = code.toUpperCase().trim()

  const inviteCode = await prisma.betaInviteCode.findUnique({
    where: { code: normalizedCode },
  })

  if (!inviteCode) {
    return { valid: false, error: 'Invalid invite code' }
  }

  if (!inviteCode.isActive) {
    return { valid: false, error: 'This invite code is no longer active' }
  }

  // Check if expired
  if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
    return { valid: false, error: 'This invite code has expired' }
  }

  // Check usage limits
  if (inviteCode.codeType !== 'UNLIMITED' && inviteCode.currentUses >= inviteCode.maxUses) {
    return { valid: false, error: 'This invite code has reached its limit' }
  }

  // Check if beta is full
  const stats = await getBetaStats()
  if (stats.spotsRemaining <= 0) {
    return { valid: false, error: 'Beta is currently full. Join the waitlist!' }
  }

  return {
    valid: true,
    code: inviteCode,
    spotsRemaining: stats.spotsRemaining,
  }
}

/**
 * Consume an invite code (mark as used, grant access)
 */
export async function consumeInviteCode(
  code: string,
  userData: {
    userId?: string
    email?: string
    ipAddress?: string
    userAgent?: string
  } = {}
): Promise<{
  success: boolean
  error?: string
  code?: any
  spotsRemaining?: number
}> {
  const validation = await validateInviteCode(code)

  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const normalizedCode = code.toUpperCase().trim()

  try {
    // Use a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Update code usage
      await tx.betaInviteCode.update({
        where: { code: normalizedCode },
        data: {
          currentUses: { increment: 1 },
          firstUsedAt: validation.code?.firstUsedAt ?? new Date(),
          lastUsedAt: new Date(),
        },
      })

      // Log the access
      await tx.betaAccessLog.create({
        data: {
          inviteCodeId: validation.code?.id,
          codeUsed: normalizedCode,
          userId: userData.userId || null,
          email: userData.email || null,
          ipAddress: userData.ipAddress || null,
          userAgent: userData.userAgent || null,
          accessGranted: true,
        },
      })

      // Update beta user count
      await tx.betaSettings.update({
        where: { id: 1 },
        data: {
          currentBetaUsers: { increment: 1 },
        },
      })
    })

    return {
      success: true,
      code: validation.code,
      spotsRemaining: (validation.spotsRemaining ?? 1) - 1,
    }
  } catch (error) {
    console.error('Error using invite code:', error)
    return { success: false, error: 'Failed to process invite code' }
  }
}

/**
 * Create invite codes for a user
 */
export async function createUserInviteCodes(userId: string, count: number = 1) {
  const codes = []

  for (let i = 0; i < count; i++) {
    const code = generateInviteCode()

    const inviteCode = await prisma.betaInviteCode.create({
      data: {
        code,
        codeType: 'SINGLE',
        maxUses: 1,
        createdByUserId: userId,
        label: 'User Invite',
        isActive: true,
      },
    })

    codes.push(inviteCode)
  }

  return codes
}

/**
 * Get user's invite codes
 */
export async function getUserInviteCodes(userId: string) {
  return prisma.betaInviteCode.findMany({
    where: { createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Add to waitlist
 */
export async function addToWaitlist(
  email: string,
  data: {
    name?: string
    interestedAs?: string
    referralSource?: string
  } = {}
): Promise<{
  success: boolean
  error?: string
  entry?: any
  position?: number
}> {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    // Check if already on waitlist
    const existing = await prisma.betaWaitlist.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      // Get their position
      const position = await getWaitlistPosition(existing.id)
      return {
        success: false,
        error: 'You\'re already on the waitlist!',
        position,
      }
    }

    // Add to waitlist
    const entry = await prisma.betaWaitlist.create({
      data: {
        email: normalizedEmail,
        name: data.name || null,
        interestedAs: data.interestedAs || 'member',
        referralSource: data.referralSource || null,
      },
    })

    // Get position
    const position = await getWaitlistPosition(entry.id)

    return {
      success: true,
      entry,
      position,
    }
  } catch (error) {
    console.error('Error adding to waitlist:', error)
    return { success: false, error: 'Failed to join waitlist' }
  }
}

/**
 * Get waitlist position for an entry
 */
async function getWaitlistPosition(entryId: string): Promise<number> {
  const entry = await prisma.betaWaitlist.findUnique({
    where: { id: entryId },
  })

  if (!entry) return 0

  const count = await prisma.betaWaitlist.count({
    where: {
      status: 'WAITING',
      createdAt: { lte: entry.createdAt },
    },
  })

  return count
}

/**
 * Get waitlist stats
 */
export async function getWaitlistStats() {
  const total = await prisma.betaWaitlist.count({
    where: { status: 'WAITING' },
  })

  return { totalWaiting: total }
}

/**
 * Check if an email is already on the waitlist
 */
export async function isOnWaitlist(email: string): Promise<boolean> {
  const entry = await prisma.betaWaitlist.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  return !!entry
}

/**
 * Mark a user as having beta access after signup
 */
export async function grantBetaAccessToUser(
  userId: string,
  inviteCode?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      betaAccessGranted: true,
      betaInviteCodeUsed: inviteCode || null,
      betaJoinedAt: new Date(),
      betaInvitesRemaining: 3, // Give them 3 invites
    },
  })

  // If they used a code, log the conversion
  if (inviteCode) {
    await prisma.betaAccessLog.updateMany({
      where: {
        codeUsed: inviteCode.toUpperCase(),
        userId: null,
      },
      data: {
        userId,
        convertedToSignup: true,
      },
    })
  }
}
