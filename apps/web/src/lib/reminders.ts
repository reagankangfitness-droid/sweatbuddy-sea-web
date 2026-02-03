import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  formatDate,
  formatTime,
  formatDateTime,
  generateCalendarLink,
  generateMapsLink,
} from '@/lib/email'
import type {
  ReminderType,
  ReminderChannel,
  ReminderStatus,
  ScheduledReminder,
  Activity,
  User,
  UserActivity,
  HostReminderSettings,
  ReminderPreferences,
} from '@prisma/client'

// Re-export types
export type { ReminderType, ReminderChannel, ReminderStatus }

// Constants
const REMINDER_INTERVALS = {
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  ONE_DAY: 24 * 60 * 60 * 1000, // 24 hours in ms
  TWO_HOURS: 2 * 60 * 60 * 1000, // 2 hours in ms
} as const

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'

// Types
interface ActivityWithHost extends Activity {
  user: Pick<User, 'id' | 'name' | 'email' | 'imageUrl'>
}

interface BookingWithActivity extends UserActivity {
  activity: ActivityWithHost
  user: Pick<User, 'id' | 'name' | 'email'>
}

interface ReminderContext {
  booking: BookingWithActivity
  reminderType: ReminderType
  hostSettings?: HostReminderSettings | null
  userPreferences?: ReminderPreferences | null
}

// =====================================================
// SCHEDULING REMINDERS
// =====================================================

/**
 * Schedule all reminders for a new booking
 * Called when someone books an activity
 */
export async function scheduleRemindersForBooking(
  userActivityId: string
): Promise<{ scheduled: number; types: ReminderType[] }> {
  const booking = await prisma.userActivity.findUnique({
    where: { id: userActivityId },
    include: {
      activity: {
        include: {
          user: {
            select: { id: true, name: true, email: true, imageUrl: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!booking || !booking.activity.startTime) {
    return { scheduled: 0, types: [] }
  }

  const startTime = new Date(booking.activity.startTime)
  const now = new Date()
  const scheduledTypes: ReminderType[] = []

  // Get host settings for this activity
  const hostSettings = await prisma.hostReminderSettings.findUnique({
    where: { activityId: booking.activityId },
  })

  // Get user's reminder preferences
  const userPreferences = await prisma.reminderPreferences.findUnique({
    where: { userId: booking.userId },
  })

  // Determine which reminders to schedule
  const remindersToSchedule: Array<{
    type: ReminderType
    scheduledFor: Date
    channel: ReminderChannel
  }> = []

  // One Week Reminder (optional)
  const oneWeekBefore = new Date(startTime.getTime() - REMINDER_INTERVALS.ONE_WEEK)
  if (
    oneWeekBefore > now &&
    (hostSettings?.enableOneWeekReminder ?? false) &&
    (userPreferences?.enableOneWeekReminder ?? false)
  ) {
    if (userPreferences?.emailReminders ?? true) {
      remindersToSchedule.push({
        type: 'ONE_WEEK' as ReminderType,
        scheduledFor: oneWeekBefore,
        channel: 'EMAIL' as ReminderChannel,
      })
    }
  }

  // One Day Reminder (default enabled)
  const oneDayBefore = new Date(startTime.getTime() - REMINDER_INTERVALS.ONE_DAY)
  if (
    oneDayBefore > now &&
    (hostSettings?.enableOneDayReminder ?? true) &&
    (userPreferences?.enableOneDayReminder ?? true)
  ) {
    if (userPreferences?.emailReminders ?? true) {
      remindersToSchedule.push({
        type: 'ONE_DAY' as ReminderType,
        scheduledFor: oneDayBefore,
        channel: 'EMAIL' as ReminderChannel,
      })
    }
  }

  // Two Hour Reminder (default enabled)
  const twoHoursBefore = new Date(startTime.getTime() - REMINDER_INTERVALS.TWO_HOURS)
  if (
    twoHoursBefore > now &&
    (hostSettings?.enableTwoHourReminder ?? true) &&
    (userPreferences?.enableTwoHourReminder ?? true)
  ) {
    // Push notification for 2-hour reminder
    if (userPreferences?.pushReminders ?? true) {
      remindersToSchedule.push({
        type: 'TWO_HOURS' as ReminderType,
        scheduledFor: twoHoursBefore,
        channel: 'PUSH' as ReminderChannel,
      })
    }
    // Also send email for 2-hour reminder
    if (userPreferences?.emailReminders ?? true) {
      remindersToSchedule.push({
        type: 'TWO_HOURS' as ReminderType,
        scheduledFor: twoHoursBefore,
        channel: 'EMAIL' as ReminderChannel,
      })
    }
  }

  // Create all scheduled reminders
  for (const reminder of remindersToSchedule) {
    try {
      await prisma.scheduledReminder.upsert({
        where: {
          userActivityId_reminderType_channel: {
            userActivityId,
            reminderType: reminder.type,
            channel: reminder.channel,
          },
        },
        create: {
          userActivityId,
          activityId: booking.activityId,
          userId: booking.userId,
          reminderType: reminder.type,
          channel: reminder.channel,
          scheduledFor: reminder.scheduledFor,
          status: 'PENDING',
        },
        update: {
          scheduledFor: reminder.scheduledFor,
          status: 'PENDING',
        },
      })
      if (!scheduledTypes.includes(reminder.type)) {
        scheduledTypes.push(reminder.type)
      }
    } catch {
      // Error handled silently
    }
  }

  return { scheduled: remindersToSchedule.length, types: scheduledTypes }
}

/**
 * Cancel all reminders for a booking
 * Called when someone cancels their booking
 */
export async function cancelRemindersForBooking(
  userActivityId: string
): Promise<number> {
  const result = await prisma.scheduledReminder.updateMany({
    where: {
      userActivityId,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  })

  return result.count
}

/**
 * Cancel all reminders for an activity
 * Called when a host cancels an activity
 */
export async function cancelRemindersForActivity(
  activityId: string
): Promise<number> {
  const result = await prisma.scheduledReminder.updateMany({
    where: {
      activityId,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  })

  return result.count
}

// =====================================================
// PROCESSING REMINDERS
// =====================================================

/**
 * Process all due reminders
 * Called by cron job every few minutes
 */
export async function processDueReminders(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const now = new Date()

  // Find all pending reminders that are due
  const dueReminders = await prisma.scheduledReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    take: 100, // Process in batches
    orderBy: { scheduledFor: 'asc' },
  })

  let sent = 0
  let failed = 0

  for (const reminder of dueReminders) {
    try {
      // Get full booking details
      const booking = await prisma.userActivity.findUnique({
        where: { id: reminder.userActivityId },
        include: {
          activity: {
            include: {
              user: {
                select: { id: true, name: true, email: true, imageUrl: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      if (!booking || booking.status === 'CANCELLED') {
        // Booking was cancelled, skip the reminder
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: 'SKIPPED' },
        })
        continue
      }

      // Get host settings
      const hostSettings = await prisma.hostReminderSettings.findUnique({
        where: { activityId: booking.activityId },
      })

      // Send the reminder based on channel
      const success = await sendReminder({
        booking: booking as BookingWithActivity,
        reminderType: reminder.reminderType,
        hostSettings,
        userPreferences: null,
      }, reminder)

      if (success) {
        sent++
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      } else {
        failed++
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: {
            status: reminder.retryCount >= 3 ? 'FAILED' : 'PENDING',
            retryCount: { increment: 1 },
            lastRetryAt: new Date(),
            // Retry in 5 minutes if not maxed out
            scheduledFor:
              reminder.retryCount < 3
                ? new Date(Date.now() + 5 * 60 * 1000)
                : undefined,
          },
        })
      }
    } catch {
      failed++
    }
  }

  return { processed: dueReminders.length, sent, failed }
}

/**
 * Send a single reminder
 */
async function sendReminder(
  context: ReminderContext,
  reminder: ScheduledReminder
): Promise<boolean> {
  const { booking, reminderType, hostSettings } = context

  if (reminder.channel === 'EMAIL') {
    return sendEmailReminder(booking, reminderType, hostSettings)
  }

  if (reminder.channel === 'PUSH') {
    return sendPushReminder(booking, reminderType)
  }

  if (reminder.channel === 'IN_APP') {
    return sendInAppReminder(booking, reminderType)
  }

  return false
}

// =====================================================
// EMAIL REMINDERS
// =====================================================

async function sendEmailReminder(
  booking: BookingWithActivity,
  reminderType: ReminderType,
  hostSettings?: HostReminderSettings | null
): Promise<boolean> {
  const { activity, user } = booking
  if (!user.email || !activity.startTime) return false

  // Get custom messages if configured
  let subject: string
  let customMessage: string | null = null

  switch (reminderType) {
    case 'ONE_WEEK':
      subject = hostSettings?.oneWeekSubject || `Reminder: ${activity.title} is in 1 week`
      customMessage = hostSettings?.oneWeekMessage || null
      break
    case 'ONE_DAY':
      subject = hostSettings?.oneDaySubject || `Tomorrow: ${activity.title}`
      customMessage = hostSettings?.oneDayMessage || null
      break
    case 'TWO_HOURS':
      subject = hostSettings?.twoHourSubject || `Starting Soon: ${activity.title}`
      customMessage = hostSettings?.twoHourMessage || null
      break
    default:
      subject = `Reminder: ${activity.title}`
  }

  // Generate links
  const activityUrl = `${BASE_URL}/activities/${activity.id}`
  const calendarLink = generateCalendarLink({
    title: activity.title,
    description: activity.description || undefined,
    location: activity.address || activity.city,
    startTime: activity.startTime,
    endTime: activity.endTime || undefined,
  })
  const mapsLink = generateMapsLink({
    address: activity.address || undefined,
    latitude: activity.latitude,
    longitude: activity.longitude,
  })

  // Build email HTML
  const html = buildReminderEmailHtml({
    userName: user.name || 'there',
    activityTitle: activity.title,
    activityDate: formatDate(activity.startTime),
    activityTime: formatTime(activity.startTime),
    activityLocation: activity.address || activity.city,
    hostName: activity.user.name || 'Your host',
    activityUrl,
    calendarLink: hostSettings?.includeCalendarLink !== false ? calendarLink : null,
    mapsLink: hostSettings?.includeMapLink !== false ? mapsLink : null,
    customMessage,
    customInstructions: hostSettings?.customInstructions || null,
    reminderType,
  })

  const result = await sendEmail({
    to: user.email,
    subject,
    html,
    tags: [
      { name: 'type', value: 'reminder' },
      { name: 'reminder_type', value: reminderType },
      { name: 'activity_id', value: activity.id },
    ],
  })

  // Log delivery
  if (result.success) {
    await prisma.reminderDeliveryLog.create({
      data: {
        userActivityId: booking.id,
        activityId: activity.id,
        userId: user.id,
        reminderType,
        channel: 'EMAIL',
        emailMessageId: result.messageId,
        emailProvider: 'resend',
      },
    })
  }

  return result.success
}

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================

async function sendPushReminder(
  booking: BookingWithActivity,
  reminderType: ReminderType
): Promise<boolean> {
  const { activity, user } = booking

  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
  })

  if (subscriptions.length === 0) {
    return true // No subscriptions, but not a failure
  }

  // Build notification payload
  const title =
    reminderType === 'TWO_HOURS'
      ? `Starting in 2 hours: ${activity.title}`
      : `Reminder: ${activity.title}`

  const body =
    reminderType === 'TWO_HOURS'
      ? `${activity.title} starts at ${formatTime(activity.startTime!)}. Tap to view details.`
      : `Don't forget about ${activity.title} on ${formatDate(activity.startTime!)}`

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: `${BASE_URL}/activities/${activity.id}`,
      activityId: activity.id,
      reminderType,
    },
  })

  // Send to all subscriptions
  let success = false

  for (const subscription of subscriptions) {
    try {
      // Web Push requires VAPID keys - will implement with actual push library
      // For now, create in-app notification as fallback
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'ACTIVITY_UPDATE',
          title,
          content: body,
          link: `/activities/${activity.id}`,
          metadata: { reminderType, activityId: activity.id },
        },
      })
      success = true
    } catch {
      // Increment failure count
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { failureCount: { increment: 1 } },
      })
    }
  }

  // Log delivery
  if (success) {
    await prisma.reminderDeliveryLog.create({
      data: {
        userActivityId: booking.id,
        activityId: activity.id,
        userId: user.id,
        reminderType,
        channel: 'PUSH',
      },
    })
  }

  return success
}

// =====================================================
// IN-APP NOTIFICATIONS
// =====================================================

async function sendInAppReminder(
  booking: BookingWithActivity,
  reminderType: ReminderType
): Promise<boolean> {
  const { activity, user } = booking

  const title =
    reminderType === 'TWO_HOURS'
      ? `Starting in 2 hours!`
      : reminderType === 'ONE_DAY'
        ? `Tomorrow!`
        : `Coming up next week`

  const content = `${activity.title} ${
    reminderType === 'TWO_HOURS'
      ? `starts at ${formatTime(activity.startTime!)}`
      : reminderType === 'ONE_DAY'
        ? `is tomorrow at ${formatTime(activity.startTime!)}`
        : `is on ${formatDate(activity.startTime!)}`
  }`

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'ACTIVITY_UPDATE',
      title,
      content,
      link: `/activities/${activity.id}`,
      metadata: { reminderType, activityId: activity.id },
    },
  })

  // Log delivery
  await prisma.reminderDeliveryLog.create({
    data: {
      userActivityId: booking.id,
      activityId: activity.id,
      userId: user.id,
      reminderType,
      channel: 'IN_APP',
    },
  })

  return true
}

// =====================================================
// EMAIL TEMPLATE
// =====================================================

function buildReminderEmailHtml(params: {
  userName: string
  activityTitle: string
  activityDate: string
  activityTime: string
  activityLocation: string
  hostName: string
  activityUrl: string
  calendarLink: string | null
  mapsLink: string | null
  customMessage: string | null
  customInstructions: string | null
  reminderType: ReminderType
}): string {
  const {
    userName,
    activityTitle,
    activityDate,
    activityTime,
    activityLocation,
    hostName,
    activityUrl,
    calendarLink,
    mapsLink,
    customMessage,
    customInstructions,
    reminderType,
  } = params

  const urgencyText =
    reminderType === 'TWO_HOURS'
      ? 'Your session starts in 2 hours!'
      : reminderType === 'ONE_DAY'
        ? 'Your session is tomorrow!'
        : 'Your session is coming up next week!'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activity Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                ${urgencyText}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName},
              </p>

              ${
                customMessage
                  ? `<p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">${customMessage}</p>`
                  : ''
              }

              <!-- Activity Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 700;">
                      ${activityTitle}
                    </h2>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                          📅 <strong style="color: #111827;">${activityDate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                          🕐 <strong style="color: #111827;">${activityTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                          📍 <strong style="color: #111827;">${activityLocation}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                          👤 Hosted by <strong style="color: #111827;">${hostName}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                customInstructions
                  ? `
              <!-- Special Instructions -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef3c7; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                      📝 From your host:
                    </p>
                    <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">
                      ${customInstructions}
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${activityUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View Activity Details
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Links -->
              ${
                calendarLink || mapsLink
                  ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  ${
                    calendarLink
                      ? `
                  <td align="center" style="padding: 8px;">
                    <a href="${calendarLink}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500;">
                      📅 Add to Calendar
                    </a>
                  </td>
                  `
                      : ''
                  }
                  ${
                    mapsLink
                      ? `
                  <td align="center" style="padding: 8px;">
                    <a href="${mapsLink}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500;">
                      🗺️ Get Directions
                    </a>
                  </td>
                  `
                      : ''
                  }
                </tr>
              </table>
              `
                  : ''
              }

              <p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center;">
                See you there! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                You're receiving this because you booked this activity on SweatBuddies.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                <a href="${BASE_URL}/settings/notifications" style="color: #10b981; text-decoration: none;">
                  Manage notification preferences
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get reminder statistics for a host
 */
export async function getHostReminderStats(hostId: string): Promise<{
  totalSent: number
  totalOpened: number
  openRate: number
  byType: Record<string, { sent: number; opened: number }>
}> {
  // Get activities hosted by this user
  const activities = await prisma.activity.findMany({
    where: { userId: hostId },
    select: { id: true },
  })

  const activityIds = activities.map((a) => a.id)

  if (activityIds.length === 0) {
    return {
      totalSent: 0,
      totalOpened: 0,
      openRate: 0,
      byType: {},
    }
  }

  // Get delivery logs for these activities
  const logs = await prisma.reminderDeliveryLog.findMany({
    where: { activityId: { in: activityIds } },
  })

  const stats = {
    totalSent: logs.length,
    totalOpened: logs.filter((l) => l.openedAt).length,
    openRate: 0,
    byType: {} as Record<string, { sent: number; opened: number }>,
  }

  stats.openRate = stats.totalSent > 0 ? (stats.totalOpened / stats.totalSent) * 100 : 0

  // Group by type
  for (const log of logs) {
    const type = log.reminderType
    if (!stats.byType[type]) {
      stats.byType[type] = { sent: 0, opened: 0 }
    }
    stats.byType[type].sent++
    if (log.openedAt) {
      stats.byType[type].opened++
    }
  }

  return stats
}

/**
 * Get user's reminder preferences, creating defaults if not exists
 */
export async function getUserReminderPreferences(
  userId: string
): Promise<ReminderPreferences> {
  let preferences = await prisma.reminderPreferences.findUnique({
    where: { userId },
  })

  if (!preferences) {
    preferences = await prisma.reminderPreferences.create({
      data: {
        userId,
        enableOneWeekReminder: false,
        enableOneDayReminder: true,
        enableTwoHourReminder: true,
        emailReminders: true,
        pushReminders: true,
        smsReminders: false,
        timezone: 'Asia/Singapore',
      },
    })
  }

  return preferences
}

/**
 * Update user's reminder preferences
 */
export async function updateUserReminderPreferences(
  userId: string,
  data: Partial<{
    enableOneWeekReminder: boolean
    enableOneDayReminder: boolean
    enableTwoHourReminder: boolean
    emailReminders: boolean
    pushReminders: boolean
    smsReminders: boolean
    quietHoursStart: number | null
    quietHoursEnd: number | null
    timezone: string
  }>
): Promise<ReminderPreferences> {
  return prisma.reminderPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  })
}
