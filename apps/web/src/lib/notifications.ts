// Notification service for creating and managing notifications

import { prisma } from '@/lib/prisma'
import { NotificationType, Prisma } from '@prisma/client'
import { ParsedMention } from './mentions'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content: string
  link?: string
  metadata?: Prisma.InputJsonValue
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, content, link, metadata } = params

  // Check user's notification preferences
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  // Check if this notification type is enabled
  if (prefs) {
    if (type === 'MENTION' && !prefs.mentionEnabled) return null
    if (type === 'MESSAGE' && !prefs.messageEnabled) return null
    if (type === 'ACTIVITY_UPDATE' && !prefs.activityEnabled) return null
    if (type === 'NUDGE' && prefs.nudgeEnabled === false) return null
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      link,
      metadata: metadata || undefined,
    },
  })
}

/**
 * Create mention notifications for a message
 */
export async function createMentionNotifications(params: {
  messageId: string
  senderId: string
  senderName: string
  mentions: ParsedMention[]
  activityId: string
  activityTitle: string
  messagePreview: string
}) {
  const {
    messageId,
    senderId,
    senderName,
    mentions,
    activityId,
    activityTitle,
    messagePreview,
  } = params

  const notifications = []

  for (const mention of mentions) {
    // Don't notify the sender about their own mentions
    if (mention.userId === senderId) continue

    // Create mention record
    await prisma.mention.create({
      data: {
        messageId,
        mentionedUserId: mention.userId,
        mentionedByUserId: senderId,
        mentionText: mention.name,
      },
    })

    // Create notification
    const notification = await createNotification({
      userId: mention.userId,
      type: 'MENTION',
      title: `${senderName} mentioned you`,
      content: `In ${activityTitle}: "${messagePreview.slice(0, 100)}${messagePreview.length > 100 ? '...' : ''}"`,
      link: `/activities/${activityId}?tab=chat`,
      metadata: {
        messageId,
        activityId,
        senderId,
        senderName,
      },
    })

    if (notification) {
      notifications.push(notification)
    }
  }

  return notifications
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options || {}

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  })
}

/**
 * Get or create notification preferences for a user
 */
export async function getOrCreateNotificationPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (existing) return existing

  return prisma.notificationPreference.create({
    data: { userId },
  })
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    mentionEnabled?: boolean
    messageEnabled?: boolean
    activityEnabled?: boolean
    emailEnabled?: boolean
    pushEnabled?: boolean
  }
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: preferences,
    create: {
      userId,
      ...preferences,
    },
  })
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  return prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  })
}
