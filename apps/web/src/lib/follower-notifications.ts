/**
 * Follower notification utilities
 * Notifies followers when a host publishes a new activity
 */

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { sendBatchEmails, formatDateTime } from '@/lib/email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

interface ActivityInfo {
  id: string
  title: string
  startTime: Date | string | null
  city: string
  categorySlug: string | null
}

/**
 * Notify all followers of a host when a new activity is published.
 * Creates in-app notifications and sends emails to opted-in followers.
 */
export async function notifyFollowersOfNewActivity(
  hostId: string,
  activity: ActivityInfo
): Promise<{ notificationsCreated: number; emailsSent: number; totalFollowers: number }> {
  // Get all followers of this host with their notification preferences and email
  const followers = await prisma.userFollower.findMany({
    where: { followingId: hostId },
    include: {
      follower: {
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          notificationPreferences: true,
        },
      },
    },
  })

  const totalFollowers = followers.length
  if (totalFollowers === 0) {
    return { notificationsCreated: 0, emailsSent: 0, totalFollowers: 0 }
  }

  // Get host name for the email
  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { name: true, firstName: true, slug: true },
  })

  const hostName = host?.firstName || host?.name?.split(' ')[0] || 'A host you follow'
  const hostSlug = host?.slug || ''

  let notificationsCreated = 0
  let emailsSent = 0

  // Create in-app notifications for all followers
  const notificationPromises = followers.map(async ({ follower }) => {
    const notification = await createNotification({
      userId: follower.id,
      type: 'ACTIVITY_UPDATE',
      title: `${hostName} posted a new activity!`,
      content: `Check out "${activity.title}" in ${activity.city}`,
      link: `/activities/${activity.id}`,
      metadata: {
        hostId,
        activityId: activity.id,
        type: 'new_activity',
      },
    })
    if (notification) notificationsCreated++
  })

  await Promise.all(notificationPromises)

  // Send emails to followers with email notifications enabled
  const emailFollowers = followers.filter(({ follower }) => {
    const prefs = follower.notificationPreferences
    // Send email if user has email enabled and activity notifications enabled
    // Default to true if no preferences set (new users get emails)
    if (!prefs) return true
    return prefs.emailEnabled && prefs.activityEnabled
  })

  if (emailFollowers.length > 0) {
    const emails = emailFollowers.map(({ follower }) => ({
      to: follower.email,
      subject: `${hostName} just posted a new activity!`,
      html: buildNewActivityEmailHtml(hostName, activity, hostSlug),
      tags: [
        { name: 'type', value: 'follower_new_activity' },
        { name: 'activity_id', value: activity.id },
      ],
    }))

    const results = await sendBatchEmails(emails)
    emailsSent = results.filter((r) => r.success).length
  }

  return { notificationsCreated, emailsSent, totalFollowers }
}

/**
 * Build HTML email for new activity notification
 */
function buildNewActivityEmailHtml(
  hostName: string,
  activity: ActivityInfo,
  hostSlug: string
): string {
  const activityUrl = `${BASE_URL}/activities/${activity.id}`
  const hostUrl = hostSlug ? `${BASE_URL}/h/${hostSlug}` : ''
  const formattedTime = activity.startTime
    ? formatDateTime(activity.startTime)
    : 'Date TBD'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Activity from ${hostName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                New Activity from ${hostName}!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                A host you follow just posted something new
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <!-- Activity Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #1e40af; font-size: 22px; font-weight: 700;">
                      ${activity.title}
                    </h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 15px; border-bottom: 1px solid #93c5fd;">
                          <span style="display: inline-block; width: 24px;">📅</span>
                          <strong>${formattedTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 15px;">
                          <span style="display: inline-block; width: 24px;">📍</span>
                          <strong>${activity.city}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${activityUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View Activity
                    </a>
                  </td>
                </tr>
              </table>

              ${hostUrl ? `
              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
                <a href="${hostUrl}" style="color: #3b82f6; text-decoration: none;">View ${hostName}'s profile</a>
              </p>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                You're receiving this because you follow ${hostName} on SweatBuddies.
              </p>
              <a href="${BASE_URL}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
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
