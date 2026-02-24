import { prisma } from '@/lib/prisma'
import { NotificationType, Prisma, Notification, NotificationPreference } from '@prisma/client'
import { sendEmail } from '@/lib/email'
import { buildNotificationEmail } from './templates'
import { sendPushToUser } from './push'

// ── Types ──

export interface NotifyParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  linkUrl?: string
  imageUrl?: string
  metadata?: Prisma.InputJsonValue
}

type TypeOverrides = Record<
  string,
  { email?: boolean; push?: boolean; inApp?: boolean }
>

// ── Internal helpers ──

async function getOrCreatePreferences(
  userId: string
): Promise<NotificationPreference> {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  })
  if (existing) return existing

  return prisma.notificationPreference.create({
    data: { userId },
  })
}

function isChannelEnabled(
  prefs: NotificationPreference,
  type: NotificationType,
  channel: 'email' | 'push' | 'inApp'
): boolean {
  const overrides = (prefs.typeOverrides as TypeOverrides) || {}
  const typeOverride = overrides[type]

  if (typeOverride && typeof typeOverride[channel] === 'boolean') {
    return typeOverride[channel]!
  }

  // Fall back to global defaults
  switch (channel) {
    case 'email':
      return prefs.emailEnabled
    case 'push':
      return prefs.pushEnabled
    case 'inApp':
      return true // in-app is always on by default
  }
}

async function dispatchEmail(
  userId: string,
  params: NotifyParams
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (!user?.email) return

    const html = buildNotificationEmail({
      title: params.title,
      body: params.body,
      linkUrl: params.linkUrl,
      imageUrl: params.imageUrl,
    })

    await sendEmail({
      to: user.email,
      subject: params.title,
      html,
      tags: [{ name: 'type', value: params.type }],
    })
  } catch (error) {
    console.error('[notify] Email dispatch failed:', error)
  }
}

async function dispatchPush(
  userId: string,
  params: NotifyParams
): Promise<void> {
  try {
    await sendPushToUser(userId, {
      title: params.title,
      body: params.body,
      data: params.linkUrl ? { url: params.linkUrl } : undefined,
    })
  } catch (error) {
    console.error('[notify] Push dispatch failed:', error)
  }
}

// ── Public API ──

export async function notify(params: NotifyParams): Promise<void> {
  try {
    const prefs = await getOrCreatePreferences(params.userId)

    // 1. In-app notification (DB row)
    if (isChannelEnabled(prefs, params.type, 'inApp')) {
      await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          content: params.body,
          link: params.linkUrl,
          imageUrl: params.imageUrl,
          metadata: params.metadata || undefined,
        },
      })
    }

    // 2. Email (fire-and-forget)
    if (isChannelEnabled(prefs, params.type, 'email')) {
      void dispatchEmail(params.userId, params)
    }

    // 3. Push (fire-and-forget)
    if (isChannelEnabled(prefs, params.type, 'push')) {
      void dispatchPush(params.userId, params)
    }
  } catch (error) {
    console.error('[notify] Failed to create notification:', error)
  }
}

export function notifyMany(paramsList: NotifyParams[]): void {
  void Promise.allSettled(paramsList.map((p) => notify(p)))
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

export async function getNotifications(
  userId: string,
  opts: {
    limit?: number
    cursor?: string
    unreadOnly?: boolean
  } = {}
): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
  const limit = opts.limit ?? 20
  const take = limit + 1 // fetch one extra to determine if there's a next page

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(opts.unreadOnly ? { isRead: false } : {}),
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    ...(opts.cursor
      ? {
          cursor: { id: opts.cursor },
          skip: 1, // skip the cursor item itself
        }
      : {}),
  })

  let nextCursor: string | null = null
  if (notifications.length > limit) {
    const last = notifications.pop()!
    nextCursor = last.id
  }

  return { notifications, nextCursor }
}

export async function deleteOldNotifications(
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  })

  return result.count
}

// Re-export preference helpers for direct use
export { getOrCreatePreferences as getOrCreateNotificationPreferences }

export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    emailEnabled?: boolean
    pushEnabled?: boolean
    typeOverrides?: Prisma.InputJsonValue
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
