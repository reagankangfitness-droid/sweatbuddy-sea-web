import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

let initialized = false

function ensureInitialized(): boolean {
  if (initialized) return true

  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  initialized = true
  return true
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; data?: { url?: string } }
): Promise<{ success: boolean; statusCode?: number }> {
  if (!ensureInitialized()) {
    return { success: false }
  }

  try {
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { success: true, statusCode: result.statusCode }
  } catch (error: unknown) {
    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : undefined
    return { success: false, statusCode }
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: { url?: string } }
): Promise<void> {
  if (!ensureInitialized()) {
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
  })

  if (subscriptions.length === 0) return

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )

      if (!result.success) {
        if (result.statusCode === 410) {
          // Subscription expired — mark inactive
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          })
        } else {
          // Increment failure count, deactivate after 5 failures
          const newCount = sub.failureCount + 1
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: {
              failureCount: newCount,
              isActive: newCount <= 5,
            },
          })
        }
      } else {
        // Reset failure count and update lastUsedAt on success
        if (sub.failureCount > 0) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { failureCount: 0, lastUsedAt: new Date() },
          })
        } else {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsedAt: new Date() },
          })
        }
      }
    })
  )

  // Log failures but don't throw
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[push] Error sending push notification:', result.reason)
    }
  }
}
