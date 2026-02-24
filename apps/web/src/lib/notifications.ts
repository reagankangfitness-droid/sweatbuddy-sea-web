// Backward compatibility — all callers should migrate to @/lib/notifications/service
import { notify } from './notifications/service'
import type { NotifyParams } from './notifications/service'
import { NotificationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
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
 * Create a notification for a user.
 * @deprecated Use `notify()` from `@/lib/notifications/service` instead.
 */
export async function createNotification(params: CreateNotificationParams) {
  const mapped: NotifyParams = {
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.content,
    linkUrl: params.link,
    metadata: params.metadata,
  }
  await notify(mapped)
  // Return a truthy value so callers that check `if (notification)` still work
  return { id: 'compat', ...params }
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
    if (mention.userId === senderId) continue

    await prisma.mention.create({
      data: {
        messageId,
        mentionedUserId: mention.userId,
        mentionedByUserId: senderId,
        mentionText: mention.name,
      },
    })

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

// Re-export from new service with old names
export {
  markAllAsRead as markAllNotificationsAsRead,
  getUnreadCount as getUnreadNotificationCount,
  getNotifications as getUserNotifications,
  deleteOldNotifications,
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from './notifications/service'

/**
 * Mark a notification as read.
 * @deprecated Use `markAsRead(notificationId, userId)` from `@/lib/notifications/service` instead.
 *
 * Backward-compat: accepts (notificationId) without userId — updates without ownership check.
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}
