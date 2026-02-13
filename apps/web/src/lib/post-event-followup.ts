import { prisma } from './prisma'
import { sendEmail } from './email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/**
 * Schedule a post-event follow-up email for 2 hours after the event ends
 */
export async function schedulePostEventFollowUp(params: {
  attendanceId: string
  eventId: string
  eventDate: Date | null
  eventTime: string
}): Promise<{ success: boolean; followUpId?: string; error?: string }> {
  const { attendanceId, eventId, eventDate, eventTime } = params

  // Can't schedule follow-up if no event date
  if (!eventDate) {
    return { success: false, error: 'No event date provided' }
  }

  // Parse the event time (e.g., "7:30 AM" or "19:30")
  const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  let hours = 8
  let minutes = 0

  if (timeMatch) {
    hours = parseInt(timeMatch[1])
    minutes = parseInt(timeMatch[2])
    const period = timeMatch[3]?.toUpperCase()

    if (period === 'PM' && hours !== 12) {
      hours += 12
    } else if (period === 'AM' && hours === 12) {
      hours = 0
    }
  }

  // Create a date object for the event start
  const eventStart = new Date(eventDate)
  eventStart.setHours(hours, minutes, 0, 0)

  // Assume event lasts ~1.5 hours, then add 2 hours for follow-up
  // So follow-up is sent ~3.5 hours after event start
  const scheduledFor = new Date(eventStart.getTime() + 3.5 * 60 * 60 * 1000)

  // Don't schedule if already in the past
  if (scheduledFor <= new Date()) {
    return { success: false, error: 'Event has already ended' }
  }

  try {
    // Check if follow-up already exists for this attendance
    const existing = await prisma.postEventFollowUp.findUnique({
      where: { attendanceId },
    })

    if (existing) {
      return { success: true, followUpId: existing.id }
    }

    // Create the follow-up
    const followUp = await prisma.postEventFollowUp.create({
      data: {
        attendanceId,
        eventId,
        scheduledFor,
        status: 'PENDING',
      },
    })

    return { success: true, followUpId: followUp.id }
  } catch {
    return { success: false, error: 'Failed to schedule follow-up' }
  }
}

/**
 * Cancel all pending follow-ups for an event (e.g., when event is cancelled)
 */
export async function cancelFollowUpsForEvent(eventId: string): Promise<{ count: number }> {
  const result = await prisma.postEventFollowUp.updateMany({
    where: {
      eventId,
      status: 'PENDING',
    },
    data: {
      status: 'SKIPPED',
    },
  })

  return { count: result.count }
}

/**
 * Process all due post-event follow-ups (called by cron job)
 */
export async function processPostEventFollowUps(): Promise<{
  processed: number
  sent: number
  failed: number
  skipped: number
}> {
  const now = new Date()
  const stats = { processed: 0, sent: 0, failed: 0, skipped: 0 }

  // Get all pending follow-ups that are due
  const dueFollowUps = await prisma.postEventFollowUp.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    take: 50, // Process in batches
  })

  for (const followUp of dueFollowUps) {
    stats.processed++

    try {
      // Get attendance details
      const attendance = await prisma.eventAttendance.findUnique({
        where: { id: followUp.attendanceId },
        select: {
          id: true,
          email: true,
          name: true,
          eventId: true,
          eventName: true,
        },
      })

      // Skip if attendance no longer exists
      if (!attendance) {
        await prisma.postEventFollowUp.update({
          where: { id: followUp.id },
          data: { status: 'SKIPPED', errorMessage: 'Attendance not found' },
        })
        stats.skipped++
        continue
      }

      // Get event details
      const event = await prisma.eventSubmission.findUnique({
        where: { id: followUp.eventId },
        select: {
          id: true,
          slug: true,
          eventName: true,
          category: true,
          organizerInstagram: true,
          communityLink: true,
          imageUrl: true,
          status: true,
        },
      })

      // Skip if event no longer exists or is cancelled
      if (!event || event.status === 'CANCELLED') {
        await prisma.postEventFollowUp.update({
          where: { id: followUp.id },
          data: { status: 'SKIPPED', errorMessage: 'Event cancelled or not found' },
        })
        stats.skipped++
        continue
      }

      // Get upcoming events in the same category (for "next event" suggestions)
      const upcomingNow = new Date()
      const upcomingEvents = await prisma.eventSubmission.findMany({
        where: {
          status: 'APPROVED',
          category: event.category,
          id: { not: event.id },
          eventDate: { gt: upcomingNow },
          OR: [
            { scheduledPublishAt: null },
            { scheduledPublishAt: { lte: upcomingNow } },
          ],
        },
        orderBy: { eventDate: 'asc' },
        take: 3,
        select: {
          id: true,
          slug: true,
          eventName: true,
          eventDate: true,
          time: true,
          imageUrl: true,
        },
      })

      // Send the follow-up email
      const emailResult = await sendPostEventFollowUpEmail({
        to: attendance.email,
        attendeeName: attendance.name,
        eventName: event.eventName,
        eventSlug: event.slug,
        eventId: event.id,
        eventImageUrl: event.imageUrl,
        organizerInstagram: event.organizerInstagram,
        communityLink: event.communityLink,
        upcomingEvents,
      })

      if (emailResult.success) {
        await prisma.postEventFollowUp.update({
          where: { id: followUp.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
        stats.sent++
      } else {
        await prisma.postEventFollowUp.update({
          where: { id: followUp.id },
          data: { status: 'FAILED', errorMessage: emailResult.error },
        })
        stats.failed++
      }
    } catch (error) {
      // Mark as failed
      await prisma.postEventFollowUp.update({
        where: { id: followUp.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      stats.failed++
    }
  }

  return stats
}

// ============= POST-EVENT FOLLOW-UP EMAIL TEMPLATE =============

interface UpcomingEvent {
  id: string
  slug: string | null
  eventName: string
  eventDate: Date | null
  time: string
  imageUrl: string | null
}

interface PostEventFollowUpEmailParams {
  to: string
  attendeeName: string | null
  eventName: string
  eventSlug: string | null
  eventId: string
  eventImageUrl: string | null
  organizerInstagram: string | null
  communityLink: string | null
  upcomingEvents: UpcomingEvent[]
}

/**
 * Send post-event follow-up email with community links, photo prompts, and next events
 */
export async function sendPostEventFollowUpEmail(
  params: PostEventFollowUpEmailParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventName,
    eventSlug,
    eventId,
    eventImageUrl,
    organizerInstagram,
    communityLink,
    upcomingEvents,
  } = params

  const displayName = attendeeName || 'there'
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`

  const instagramLink = organizerInstagram
    ? `https://instagram.com/${organizerInstagram.replace('@', '')}`
    : null

  // Build upcoming events HTML
  const upcomingEventsHtml = upcomingEvents.length > 0
    ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 0;">
            <h3 style="margin: 0 0 16px; color: #374151; font-size: 18px; font-weight: 600;">
              More experiences you might like
            </h3>
          </td>
        </tr>
        ${upcomingEvents.map(evt => {
          const evtUrl = evt.slug ? `${BASE_URL}/e/${evt.slug}` : `${BASE_URL}/e/${evt.id}`
          const evtDate = evt.eventDate
            ? new Date(evt.eventDate).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' })
            : ''
          return `
            <tr>
              <td style="padding: 8px 0;">
                <a href="${evtUrl}" style="text-decoration: none; display: block;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="width: 80px; vertical-align: top;">
                        <img src="${evt.imageUrl || `${BASE_URL}/images/placeholder-event.jpg`}" alt="${evt.eventName}" style="width: 80px; height: 80px; object-fit: cover; display: block;" />
                      </td>
                      <td style="padding: 12px; vertical-align: middle;">
                        <p style="margin: 0 0 4px; color: #111827; font-size: 15px; font-weight: 600;">
                          ${evt.eventName}
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">
                          ${evtDate} at ${evt.time}
                        </p>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          `
        }).join('')}
      </table>
    `
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was ${eventName}?</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎊</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Great workout!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Hope you had an amazing time
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName}! 👋
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for showing up to <strong>${eventName}</strong> today! We hope you had an amazing workout and met some awesome people.
              </p>

              <!-- Photo Prompt Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 12px;">📸</div>
                    <h3 style="margin: 0 0 8px; color: #92400e; font-size: 18px; font-weight: 700;">
                      Got photos from today?
                    </h3>
                    <p style="margin: 0 0 16px; color: #a16207; font-size: 14px; line-height: 1.5;">
                      Share them with the community! Tag <strong>@_sweatbuddies</strong> on Instagram and we'll feature them.
                    </p>
                    <a href="https://instagram.com/_sweatbuddies" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      Tag Us on Instagram
                    </a>
                  </td>
                </tr>
              </table>

              ${communityLink ? `
              <!-- Community Link Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 12px;">${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '💬' : '👥'}</div>
                    <h3 style="margin: 0 0 8px; color: #065f46; font-size: 18px; font-weight: 700;">
                      Stay connected!
                    </h3>
                    <p style="margin: 0 0 16px; color: #047857; font-size: 14px; line-height: 1.5;">
                      Join the community group to stay in the loop for future sessions and connect with other attendees.
                    </p>
                    <a href="${communityLink}" style="display: inline-block; padding: 12px 24px; background-color: ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '#25D366' : '#0088cc'}; color: white; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      Join Community Group
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${instagramLink ? `
              <!-- Organizer Follow Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 12px; color: #374151; font-size: 15px;">
                      Follow the organizer for updates on future experiences
                    </p>
                    <a href="${instagramLink}" style="display: inline-block; padding: 10px 20px; background-color: #e1306c; color: white; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      Follow @${organizerInstagram?.replace('@', '')}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${upcomingEventsHtml}

              <!-- Browse Events Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${BASE_URL}/events" style="display: inline-block; padding: 14px 28px; background-color: #8b5cf6; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Browse More Experiences
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                See you at the next one! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <a href="${eventUrl}" style="display: inline-block; margin-bottom: 16px; color: #8b5cf6; text-decoration: none; font-size: 14px; font-weight: 500;">
                View Experience Details &rarr;
              </a>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more experiences at
              </p>
              <a href="${BASE_URL}" style="color: #8b5cf6; text-decoration: none; font-size: 14px; font-weight: 600;">
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

  return sendEmail({
    to,
    subject: `Thanks for coming to ${eventName}! 🎊`,
    html,
    tags: [
      { name: 'type', value: 'post_event_followup' },
      { name: 'event_id', value: eventId },
    ],
  })
}
