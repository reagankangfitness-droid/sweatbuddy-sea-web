// Activity Waitlist & Urgency System
// Handles waitlist management, spot availability, and urgency calculations

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import {
  ActivityWaitlistStatus,
  WaitlistNotificationType,
} from '@prisma/client'

// =====================================================
// TYPES
// =====================================================

export type UrgencyLevel = 'none' | 'medium' | 'high' | 'critical' | 'full'

export interface SpotsInfo {
  totalSpots: number
  spotsRemaining: number
  spotsTaken: number
  percentFilled: number
  urgencyLevel: UrgencyLevel
  showSpotsRemaining: boolean
  urgencyThreshold: number
  waitlistEnabled: boolean
  waitlistLimit: number
  waitlistCount: number
  isFull: boolean
}

export interface UserWaitlistStatus {
  isOnWaitlist: boolean
  position: number
  status: ActivityWaitlistStatus
  notifiedAt: Date | null
  expiresAt: Date | null
}

export interface WaitlistEntry {
  id: string
  position: number
  status: ActivityWaitlistStatus
  name: string | null
  email: string | null
  avatar: string | null
  joinedAt: Date
  notifiedAt: Date | null
  expiresAt: Date | null
}

export interface JoinWaitlistResult {
  success: boolean
  error?: string
  entry?: {
    id: string
    position: number
    status: ActivityWaitlistStatus
  }
  position?: number
  message?: string
}

// =====================================================
// SPOTS & URGENCY FUNCTIONS
// =====================================================

/**
 * Check if activity has available spots
 */
export async function hasAvailableSpots(
  activityId: string,
  requestedQuantity = 1
): Promise<boolean> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      maxPeople: true,
      _count: {
        select: {
          userActivities: {
            where: { status: 'JOINED' },
          },
        },
      },
    },
  })

  if (!activity) return false
  if (!activity.maxPeople) return true // No limit set

  const currentParticipants = activity._count.userActivities
  return activity.maxPeople - currentParticipants >= requestedQuantity
}

/**
 * Get spots info for an activity with urgency calculation
 */
export async function getSpotsInfo(activityId: string): Promise<SpotsInfo | null> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      maxPeople: true,
      urgencySettings: true,
      _count: {
        select: {
          userActivities: {
            where: { status: 'JOINED' },
          },
        },
      },
    },
  })

  if (!activity) return null

  // Get waitlist stats
  const waitlistCount = await prisma.activityWaitlist.count({
    where: {
      activityId,
      status: 'WAITING',
    },
  })

  // Get settings with defaults
  const settings = activity.urgencySettings || {
    showSpotsRemaining: true,
    urgencyThreshold: 5,
    waitlistEnabled: true,
    waitlistLimit: 50,
  }

  const totalSpots = activity.maxPeople || 0
  const spotsTaken = activity._count.userActivities
  const spotsRemaining = Math.max(0, totalSpots - spotsTaken)
  const percentFilled = totalSpots > 0 ? Math.round((spotsTaken / totalSpots) * 100) : 0

  // Calculate urgency level
  let urgencyLevel: UrgencyLevel = 'none'
  if (totalSpots > 0) {
    if (spotsRemaining === 0) {
      urgencyLevel = 'full'
    } else if (spotsRemaining <= 3) {
      urgencyLevel = 'critical'
    } else if (spotsRemaining <= settings.urgencyThreshold) {
      urgencyLevel = 'high'
    } else if (percentFilled >= 70) {
      urgencyLevel = 'medium'
    }
  }

  return {
    totalSpots,
    spotsRemaining,
    spotsTaken,
    percentFilled,
    urgencyLevel,
    showSpotsRemaining: settings.showSpotsRemaining,
    urgencyThreshold: settings.urgencyThreshold,
    waitlistEnabled: settings.waitlistEnabled,
    waitlistLimit: settings.waitlistLimit,
    waitlistCount,
    isFull: spotsRemaining === 0 && totalSpots > 0,
  }
}

// =====================================================
// WAITLIST MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get next waitlist position for an activity
 */
async function getNextWaitlistPosition(activityId: string): Promise<number> {
  const lastEntry = await prisma.activityWaitlist.findFirst({
    where: { activityId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  return (lastEntry?.position || 0) + 1
}

/**
 * Join the waitlist for an activity
 */
export async function joinWaitlist(
  activityId: string,
  userData: {
    userId?: string
    email?: string
    name?: string
  }
): Promise<JoinWaitlistResult> {
  const { userId, email, name } = userData

  // Validate: must have userId or email
  if (!userId && !email) {
    return { success: false, error: 'User ID or email is required' }
  }

  // Check if activity exists and get settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      title: true,
      hostId: true,
      urgencySettings: true,
    },
  })

  if (!activity) {
    return { success: false, error: 'Activity not found' }
  }

  const settings = activity.urgencySettings || {
    waitlistEnabled: true,
    waitlistLimit: 50,
  }

  if (!settings.waitlistEnabled) {
    return { success: false, error: 'Waitlist is not available for this activity' }
  }

  // Check if already on waitlist
  const existingEntry = await prisma.activityWaitlist.findFirst({
    where: {
      activityId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
  })

  if (existingEntry) {
    return {
      success: false,
      error: 'You are already on the waitlist',
      position: existingEntry.position,
    }
  }

  // Check waitlist limit
  const currentCount = await prisma.activityWaitlist.count({
    where: {
      activityId,
      status: 'WAITING',
    },
  })

  if (currentCount >= settings.waitlistLimit) {
    return { success: false, error: 'Waitlist is currently full' }
  }

  // Get next position
  const position = await getNextWaitlistPosition(activityId)

  // Add to waitlist
  const entry = await prisma.activityWaitlist.create({
    data: {
      activityId,
      userId: userId || null,
      email: email?.toLowerCase() || null,
      name: name || null,
      position,
      status: 'WAITING',
    },
  })

  // Log the notification (confirmation)
  await prisma.waitlistNotification.create({
    data: {
      waitlistEntryId: entry.id,
      activityId,
      userId: userId || null,
      email: email?.toLowerCase() || null,
      notificationType: 'CONFIRMATION',
      channel: 'email',
    },
  })

  // Create in-app notification for the user
  if (userId) {
    await createNotification({
      userId,
      type: 'ACTIVITY_UPDATE',
      title: `You're #${position} on the waitlist!`,
      content: `We'll notify you when a spot opens up for "${activity.title}"`,
      link: `/activities/${activityId}`,
      metadata: { activityId, waitlistPosition: position },
    })
  }

  // Notify host at milestones
  await notifyHostOfWaitlistMilestone(activity.id, activity.hostId, activity.title, currentCount + 1)

  return {
    success: true,
    entry: {
      id: entry.id,
      position: entry.position,
      status: entry.status,
    },
    position,
    message: `You're #${position} on the waitlist!`,
  }
}

/**
 * Leave the waitlist
 */
export async function leaveWaitlist(
  activityId: string,
  userId?: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId && !email) {
    return { success: false, error: 'User ID or email is required' }
  }

  const result = await prisma.activityWaitlist.updateMany({
    where: {
      activityId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })

  return { success: result.count > 0 }
}

/**
 * Get user's waitlist status for an activity
 */
export async function getUserWaitlistStatus(
  activityId: string,
  userId?: string,
  email?: string
): Promise<UserWaitlistStatus | null> {
  if (!userId && !email) return null

  const entry = await prisma.activityWaitlist.findFirst({
    where: {
      activityId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
  })

  if (!entry) return null

  return {
    isOnWaitlist: true,
    position: entry.position,
    status: entry.status,
    notifiedAt: entry.notifiedAt,
    expiresAt: entry.notificationExpiresAt,
  }
}

/**
 * Get all waitlist entries for a user
 */
export async function getUserWaitlistEntries(userId: string) {
  return prisma.activityWaitlist.findMany({
    where: {
      userId,
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          startTime: true,
          imageUrl: true,
          price: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get waitlist for a host's activity
 */
export async function getActivityWaitlist(
  activityId: string,
  hostId: string
): Promise<{ success: boolean; error?: string; waitlist?: WaitlistEntry[]; totalWaiting?: number; totalNotified?: number }> {
  // Verify host owns activity
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      OR: [{ userId: hostId }, { hostId }],
    },
  })

  if (!activity) {
    return { success: false, error: 'Activity not found or you do not have permission' }
  }

  const entries = await prisma.activityWaitlist.findMany({
    where: {
      activityId,
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { position: 'asc' },
  })

  const waitlist: WaitlistEntry[] = entries.map((entry) => ({
    id: entry.id,
    position: entry.position,
    status: entry.status,
    name: entry.user?.name || entry.name || null,
    email: entry.user?.email || entry.email || null,
    avatar: entry.user?.imageUrl || null,
    joinedAt: entry.createdAt,
    notifiedAt: entry.notifiedAt,
    expiresAt: entry.notificationExpiresAt,
  }))

  return {
    success: true,
    waitlist,
    totalWaiting: waitlist.filter((e) => e.status === 'WAITING').length,
    totalNotified: waitlist.filter((e) => e.status === 'NOTIFIED').length,
  }
}

// =====================================================
// SPOT RELEASE & NOTIFICATION FUNCTIONS
// =====================================================

/**
 * Process waitlist when a spot becomes available (e.g., after cancellation)
 */
export async function processWaitlistForSpot(
  activityId: string,
  spotsAvailable = 1
): Promise<{ notified: number }> {
  // Get next person(s) on waitlist
  const nextInLine = await prisma.activityWaitlist.findMany({
    where: {
      activityId,
      status: 'WAITING',
    },
    orderBy: { position: 'asc' },
    take: spotsAvailable,
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  })

  if (nextInLine.length === 0) {
    return { notified: 0 }
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      title: true,
      startTime: true,
      price: true,
      urgencySettings: true,
    },
  })

  if (!activity) return { notified: 0 }

  const notificationWindowHours = activity.urgencySettings?.notificationWindowHours || 24
  let notifiedCount = 0

  for (const entry of nextInLine) {
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + notificationWindowHours * 60 * 60 * 1000)

    // Update status to notified
    await prisma.activityWaitlist.update({
      where: { id: entry.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
        notificationExpiresAt: expiresAt,
      },
    })

    // Log notification
    await prisma.waitlistNotification.create({
      data: {
        waitlistEntryId: entry.id,
        activityId,
        userId: entry.userId,
        email: entry.email,
        notificationType: 'SPOT_AVAILABLE',
        channel: 'email',
        metadata: {
          activityTitle: activity.title,
          expiresAt: expiresAt.toISOString(),
        },
      },
    })

    // Create in-app notification
    if (entry.userId) {
      await createNotification({
        userId: entry.userId,
        type: 'ACTIVITY_UPDATE',
        title: '🎉 A spot opened up!',
        content: `Book now for "${activity.title}" - you have ${notificationWindowHours} hours!`,
        link: `/activities/${activityId}?from=waitlist`,
        metadata: {
          activityId,
          waitlistEntryId: entry.id,
          expiresAt: expiresAt.toISOString(),
        },
      })
    }

    notifiedCount++
  }

  return { notified: notifiedCount }
}

/**
 * Handle expired waitlist notifications
 * Should be called periodically (e.g., via cron job)
 */
export async function processExpiredNotifications(): Promise<{ processed: number }> {
  // Find expired notifications
  const expired = await prisma.activityWaitlist.findMany({
    where: {
      status: 'NOTIFIED',
      notificationExpiresAt: { lt: new Date() },
    },
  })

  for (const entry of expired) {
    // Mark as expired
    await prisma.activityWaitlist.update({
      where: { id: entry.id },
      data: {
        status: 'EXPIRED',
        updatedAt: new Date(),
      },
    })

    // Log expiry notification
    await prisma.waitlistNotification.create({
      data: {
        waitlistEntryId: entry.id,
        activityId: entry.activityId,
        userId: entry.userId,
        email: entry.email,
        notificationType: 'EXPIRED',
        channel: 'email',
      },
    })

    // Check if spot is still available and notify next person
    const spotsInfo = await getSpotsInfo(entry.activityId)
    if (spotsInfo && spotsInfo.spotsRemaining > 0) {
      await processWaitlistForSpot(entry.activityId, 1)
    }
  }

  return { processed: expired.length }
}

/**
 * Mark waitlist entry as converted (when user books)
 */
export async function convertWaitlistToBooking(
  activityId: string,
  userId?: string,
  email?: string,
  userActivityId?: string
): Promise<{ success: boolean }> {
  if (!userId && !email) {
    return { success: false }
  }

  const result = await prisma.activityWaitlist.updateMany({
    where: {
      activityId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
    data: {
      status: 'BOOKED',
      convertedToBooking: true,
      userActivityId: userActivityId || null,
      updatedAt: new Date(),
    },
  })

  return { success: result.count > 0 }
}

// =====================================================
// HOST NOTIFICATION HELPERS
// =====================================================

/**
 * Notify host when waitlist hits milestones
 */
async function notifyHostOfWaitlistMilestone(
  activityId: string,
  hostId: string | null,
  activityTitle: string,
  waitlistCount: number
) {
  // Notify at milestones: 5, 10, 20, 50
  const milestones = [5, 10, 20, 50]
  if (!milestones.includes(waitlistCount) || !hostId) return

  await createNotification({
    userId: hostId,
    type: 'ACTIVITY_UPDATE',
    title: `🔥 ${waitlistCount} people waiting!`,
    content: `${waitlistCount} people are on the waitlist for "${activityTitle}". Consider adding more spots or creating another session!`,
    link: `/activities/${activityId}/manage`,
    metadata: {
      activityId,
      waitlistCount,
      milestone: true,
    },
  })
}

// =====================================================
// URGENCY SETTINGS MANAGEMENT
// =====================================================

/**
 * Get or create urgency settings for an activity
 */
export async function getOrCreateUrgencySettings(activityId: string) {
  const existing = await prisma.activityUrgencySettings.findUnique({
    where: { activityId },
  })

  if (existing) return existing

  return prisma.activityUrgencySettings.create({
    data: { activityId },
  })
}

/**
 * Update urgency settings for an activity
 */
export async function updateUrgencySettings(
  activityId: string,
  settings: {
    showSpotsRemaining?: boolean
    urgencyThreshold?: number
    waitlistEnabled?: boolean
    waitlistLimit?: number
    notificationWindowHours?: number
  }
) {
  return prisma.activityUrgencySettings.upsert({
    where: { activityId },
    update: settings,
    create: {
      activityId,
      ...settings,
    },
  })
}
