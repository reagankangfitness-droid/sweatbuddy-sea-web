import crypto from 'crypto'
import { prisma } from './prisma'
import { sendEmail, generateMapsLink } from './email'
import { getFamiliarFaces, type FamiliarFace } from './familiar-faces'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/** Escape HTML special characters to prevent injection in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ============= TIME HELPERS =============

/**
 * Parse a time string like "7:30 AM" into hours and minutes (24h format).
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
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

  return { hours, minutes }
}

/**
 * Compute the exact event start time in UTC by combining eventDate with
 * the parsed time string. eventDate from Prisma is typically midnight UTC
 * for the event day; we interpret the time string as SGT (UTC+8).
 */
export function computeEventStartTime(eventDate: Date, timeStr: string): Date {
  const { hours, minutes } = parseTimeString(timeStr)

  // Start from the event date (midnight UTC for the day)
  const startTime = new Date(eventDate)
  // Set the time in SGT: SGT = UTC+8, so subtract 8 to convert to UTC
  startTime.setUTCHours(hours - 8, minutes, 0, 0)

  return startTime
}

// ============= UNSUBSCRIBE HELPERS =============

/**
 * Generate an HMAC-SHA256 unsubscribe token for an attendanceId.
 */
export function generateUnsubscribeToken(attendanceId: string): string {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new Error('CRON_SECRET not configured')
  return crypto.createHmac('sha256', secret).update(attendanceId).digest('hex')
}

/**
 * Verify an unsubscribe token using timing-safe comparison.
 */
export function verifyUnsubscribeToken(attendanceId: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(attendanceId)
    const expectedBuf = Buffer.from(expected, 'hex')
    const tokenBuf = Buffer.from(token, 'hex')
    if (expectedBuf.length !== tokenBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, tokenBuf)
  } catch {
    return false
  }
}

// ============= SCHEDULING =============

/**
 * Schedule reminders for an attendee — both 24h and 2h before the event.
 * If the 24h window has passed, only the 2h reminder is scheduled.
 */
export async function scheduleEventReminder(params: {
  attendanceId: string
  eventId: string
  eventDate: Date | null
  eventTime?: string // e.g. "7:30 AM"
}): Promise<{ success: boolean; reminderIds?: string[]; error?: string }> {
  const { attendanceId, eventId, eventDate, eventTime } = params

  if (!eventDate) {
    return { success: false, error: 'No event date provided' }
  }

  const now = new Date()
  const reminderIds: string[] = []

  // Compute exact event start time for the 2h reminder
  const eventStartTime = eventTime
    ? computeEventStartTime(eventDate, eventTime)
    : new Date(eventDate)

  // 24-hour reminder: eventDate - 24h (existing behavior)
  const oneDayBefore = new Date(eventDate)
  oneDayBefore.setHours(oneDayBefore.getHours() - 24)

  // 2-hour reminder: eventStartTime - 2h
  const twoHoursBefore = new Date(eventStartTime)
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2)

  const toSchedule: Array<{ type: 'ONE_DAY' | 'TWO_HOURS'; scheduledFor: Date }> = []

  if (oneDayBefore > now) {
    toSchedule.push({ type: 'ONE_DAY', scheduledFor: oneDayBefore })
  }
  if (twoHoursBefore > now) {
    toSchedule.push({ type: 'TWO_HOURS', scheduledFor: twoHoursBefore })
  }

  if (toSchedule.length === 0) {
    return { success: false, error: 'Event is too soon for any reminders' }
  }

  try {
    for (const { type, scheduledFor } of toSchedule) {
      const existing = await prisma.eventReminder.findUnique({
        where: { attendanceId_reminderType: { attendanceId, reminderType: type } },
      })

      if (existing) {
        reminderIds.push(existing.id)
        continue
      }

      const reminder = await prisma.eventReminder.create({
        data: {
          attendanceId,
          eventId,
          reminderType: type,
          scheduledFor,
          status: 'PENDING',
        },
      })
      reminderIds.push(reminder.id)
    }

    return { success: true, reminderIds }
  } catch {
    return { success: false, error: 'Failed to schedule reminders' }
  }
}

/**
 * Cancel all pending reminders for an event (e.g., when event is cancelled)
 */
export async function cancelRemindersForEvent(eventId: string): Promise<{ count: number }> {
  const result = await prisma.eventReminder.updateMany({
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

// ============= PROCESSING =============

/**
 * Process all due reminders (called by cron job).
 * Groups by event for efficient familiar-faces computation.
 */
export async function processEventReminders(): Promise<{
  processed: number
  sent: number
  failed: number
  skipped: number
}> {
  const now = new Date()
  const stats = { processed: 0, sent: 0, failed: 0, skipped: 0 }

  // Get all pending reminders that are due
  const dueReminders = await prisma.eventReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    take: 100,
  })

  if (dueReminders.length === 0) return stats

  // Group reminders by eventId
  const remindersByEvent = new Map<string, typeof dueReminders>()
  for (const reminder of dueReminders) {
    const group = remindersByEvent.get(reminder.eventId) || []
    group.push(reminder)
    remindersByEvent.set(reminder.eventId, group)
  }

  // Process each event group
  for (const [eventId, reminders] of remindersByEvent) {
    // Fetch event details once per group
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        slug: true,
        eventName: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        status: true,
        organizerInstagram: true,
        communityLink: true,
      },
    })

    // Skip entire group if event cancelled/not found
    if (!event || event.status === 'CANCELLED') {
      for (const reminder of reminders) {
        stats.processed++
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { status: 'SKIPPED', errorMessage: 'Event cancelled or not found' },
        })
        stats.skipped++
      }
      continue
    }

    // Process each reminder in the group
    for (const reminder of reminders) {
      stats.processed++

      try {
        // Get attendance details
        const attendance = await prisma.eventAttendance.findUnique({
          where: { id: reminder.attendanceId },
          select: {
            id: true,
            email: true,
            name: true,
            eventId: true,
            eventName: true,
            subscribe: true,
          },
        })

        if (!attendance) {
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { status: 'SKIPPED', errorMessage: 'Attendance not found' },
          })
          stats.skipped++
          continue
        }

        // Check subscribe=false on attendance → skip
        if (attendance.subscribe === false) {
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { status: 'SKIPPED', errorMessage: 'User unsubscribed' },
          })
          stats.skipped++
          continue
        }

        // Check ReminderPreferences via email → User → userId
        const user = await prisma.user.findFirst({
          where: { email: { equals: attendance.email, mode: 'insensitive' } },
          select: { id: true },
        })

        if (user) {
          const prefs = await prisma.reminderPreferences.findUnique({
            where: { userId: user.id },
          })

          if (prefs) {
            // Check global email opt-out
            if (!prefs.emailReminders) {
              await prisma.eventReminder.update({
                where: { id: reminder.id },
                data: { status: 'SKIPPED', errorMessage: 'Email reminders disabled' },
              })
              stats.skipped++
              continue
            }

            // Check per-type opt-out
            if (reminder.reminderType === 'ONE_DAY' && !prefs.enableOneDayReminder) {
              await prisma.eventReminder.update({
                where: { id: reminder.id },
                data: { status: 'SKIPPED', errorMessage: 'One-day reminder disabled' },
              })
              stats.skipped++
              continue
            }
            if (reminder.reminderType === 'TWO_HOURS' && !prefs.enableTwoHourReminder) {
              await prisma.eventReminder.update({
                where: { id: reminder.id },
                data: { status: 'SKIPPED', errorMessage: 'Two-hour reminder disabled' },
              })
              stats.skipped++
              continue
            }
          }
          // No prefs record → default to sending both (matches schema defaults)
        }

        // Compute familiar faces
        let familiarFaces: FamiliarFace[] = []
        let totalGoing = 0
        try {
          const result = await getFamiliarFaces(attendance.email, eventId)
          familiarFaces = result.familiarFaces
          totalGoing = result.totalGoing
        } catch {
          // Non-fatal: send email without social context
        }

        // Generate unsubscribe URL
        const unsubscribeToken = generateUnsubscribeToken(attendance.id)
        const unsubscribeUrl = `${BASE_URL}/api/reminders/unsubscribe?aid=${encodeURIComponent(attendance.id)}&token=${encodeURIComponent(unsubscribeToken)}`

        // Send the social reminder email
        const emailResult = await sendSocialReminderEmail({
          to: attendance.email,
          attendeeName: attendance.name,
          eventName: event.eventName,
          eventDay: event.day,
          eventDate: event.eventDate,
          eventTime: event.time,
          eventLocation: event.location,
          eventSlug: event.slug,
          eventId: event.id,
          organizerInstagram: event.organizerInstagram,
          communityLink: event.communityLink,
          reminderType: reminder.reminderType as 'ONE_DAY' | 'TWO_HOURS',
          familiarFaces,
          totalGoing,
          unsubscribeUrl,
        })

        if (emailResult.success) {
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { status: 'SENT', sentAt: new Date() },
          })
          stats.sent++
        } else {
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { status: 'FAILED', errorMessage: emailResult.error },
          })
          stats.failed++
        }
      } catch (error) {
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        stats.failed++
      }
    }
  }

  return stats
}

// ============= SOCIAL REMINDER EMAIL TEMPLATE =============

interface SocialReminderEmailParams {
  to: string
  attendeeName: string | null
  eventName: string
  eventDay: string
  eventDate: Date | null
  eventTime: string
  eventLocation: string
  eventSlug: string | null
  eventId: string
  organizerInstagram: string | null
  communityLink: string | null
  reminderType: 'ONE_DAY' | 'TWO_HOURS'
  familiarFaces: FamiliarFace[]
  totalGoing: number
  unsubscribeUrl: string
}

/**
 * Send a reminder email with social context (familiar faces).
 */
export async function sendSocialReminderEmail(
  params: SocialReminderEmailParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventName,
    eventDay,
    eventDate,
    eventTime,
    eventLocation,
    eventSlug,
    eventId,
    organizerInstagram,
    communityLink,
    reminderType,
    familiarFaces,
    totalGoing,
    unsubscribeUrl,
  } = params

  const isOneDay = reminderType === 'ONE_DAY'
  const displayName = escapeHtml(attendeeName || 'there')
  const safeEventName = escapeHtml(eventName)
  const safeEventTime = escapeHtml(eventTime)
  const safeEventLocation = escapeHtml(eventLocation)
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`
  const mapsLink = generateMapsLink({ address: eventLocation })

  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-SG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Singapore',
      })
    : eventDay

  const calendarLink = generateCalendarLink({
    eventName,
    eventDay: formattedDate,
    eventTime,
    eventLocation,
  })

  const instagramLink = organizerInstagram
    ? `https://instagram.com/${organizerInstagram.replace('@', '')}`
    : null

  // Subject line
  const subject = isOneDay
    ? `Tomorrow: ${eventName}`
    : `Starting Soon: ${eventName}`

  // Header content
  const headerEmoji = isOneDay ? '🏃' : '🔥'
  const headerTitle = isOneDay ? 'See You Tomorrow!' : 'Starting in 2 Hours!'
  const headerSubtitle = isOneDay ? 'Your experience is coming up' : 'Get ready to go!'
  const emailTitle = isOneDay ? 'Experience Tomorrow!' : 'Starting Soon!'
  const reminderText = isOneDay
    ? `Just a friendly reminder that you're signed up for <strong>${safeEventName}</strong> tomorrow!`
    : `<strong>${safeEventName}</strong> is starting in just 2 hours! Time to get moving!`

  // Social context section
  const socialHtml = buildSocialContextHtml(familiarFaces, totalGoing)

  // Tips section (24h only)
  const tipsHtml = isOneDay
    ? `
              <!-- Tips -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef9c3; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #854d0e; font-size: 14px; font-weight: 600;">
                      Quick reminders:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #854d0e; font-size: 14px; line-height: 1.8;">
                      <li>Arrive 5-10 minutes early</li>
                      <li>Bring water and a towel</li>
                      <li>Wear comfortable workout clothes</li>
                    </ul>
                  </td>
                </tr>
              </table>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">${headerEmoji}</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                ${headerTitle}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName}!
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${reminderText}
              </p>

              ${socialHtml}

              <!-- Event Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 22px; font-weight: 700;">
                      ${safeEventName}
                    </h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #3730a3; font-size: 15px; border-bottom: 1px solid #93c5fd;">
                          <span style="display: inline-block; width: 24px;">📅</span>
                          <strong>${formattedDate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #3730a3; font-size: 15px; border-bottom: 1px solid #93c5fd;">
                          <span style="display: inline-block; width: 24px;">🕐</span>
                          <strong>${safeEventTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #3730a3; font-size: 15px;">
                          <span style="display: inline-block; width: 24px;">📍</span>
                          <strong>${safeEventLocation}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${mapsLink}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Get Directions
                    </a>
                  </td>
                </tr>
              </table>

              ${communityLink ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${communityLink}" style="display: inline-block; padding: 14px 28px; background-color: ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '#25D366' : '#0088cc'}; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Join Group Chat
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Quick Links -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${calendarLink}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      Add to Calendar
                    </a>
                    ${instagramLink ? `
                    <a href="${instagramLink}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      @${escapeHtml(organizerInstagram || '')}
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

              ${tipsHtml}

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Can't make it? <a href="${eventUrl}" style="color: #3b82f6; text-decoration: underline;">Manage your RSVP</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <a href="${eventUrl}" style="display: inline-block; margin-bottom: 16px; color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">
                View Experience Details &rarr;
              </a>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more experiences at
              </p>
              <a href="${BASE_URL}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
              <p style="margin: 12px 0 0; color: #94a3b8; font-size: 11px;">
                <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from reminders for this event</a>
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

  return sendEmail({
    to,
    subject,
    html,
    tags: [
      { name: 'type', value: `event_reminder_${reminderType.toLowerCase()}` },
      { name: 'event_id', value: eventId },
    ],
  })
}

/**
 * Build the social context HTML section for the reminder email.
 */
function buildSocialContextHtml(familiarFaces: FamiliarFace[], totalGoing: number): string {
  if (familiarFaces.length === 0 && totalGoing === 0) return ''

  let socialText: string
  if (familiarFaces.length > 0) {
    const names = familiarFaces
      .slice(0, 3)
      .map((f) => escapeHtml(f.firstName || f.name || 'Someone'))
    const othersCount = totalGoing - familiarFaces.length - 1 // -1 for the current user

    if (names.length === 1 && othersCount > 0) {
      socialText = `${names[0]} and ${othersCount} other${othersCount === 1 ? '' : 's'} you've worked out with are also going!`
    } else if (names.length === 2 && othersCount > 0) {
      socialText = `${names[0]}, ${names[1]}, and ${othersCount} other${othersCount === 1 ? '' : 's'} you've worked out with are also going!`
    } else if (names.length >= 3 && othersCount > 0) {
      socialText = `${names[0]}, ${names[1]}, ${names[2]}, and ${othersCount} other${othersCount === 1 ? '' : 's'} you've worked out with are also going!`
    } else {
      socialText = `${names.join(' and ')} ${names.length === 1 ? 'is' : 'are'} also going!`
    }
  } else {
    socialText = `${totalGoing} ${totalGoing === 1 ? 'person is' : 'people are'} going — time to make new sweat buddies!`
  }

  // Build avatar circles (up to 3)
  const avatarHtml = familiarFaces.length > 0
    ? familiarFaces.slice(0, 3).map((face) => {
        const initials = escapeHtml(
          (face.firstName || face.name || '?').charAt(0).toUpperCase()
        )
        if (face.imageUrl) {
          return `<td style="padding: 0 4px;"><img src="${escapeHtml(face.imageUrl)}" alt="${initials}" width="40" height="40" style="border-radius: 50%; border: 2px solid white; display: block;" /></td>`
        }
        return `<td style="padding: 0 4px;"><div style="width: 40px; height: 40px; border-radius: 50%; background-color: #3b82f6; color: white; font-size: 16px; font-weight: 600; line-height: 40px; text-align: center; border: 2px solid white;">${initials}</div></td>`
      }).join('')
    : ''

  return `
              <!-- Social Context -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f0fdf4; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    ${avatarHtml ? `
                    <table role="presentation" style="border-collapse: collapse; margin: 0 0 8px;">
                      <tr>${avatarHtml}</tr>
                    </table>
                    ` : ''}
                    <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">
                      ${familiarFaces.length > 0 ? '🤝' : '🎉'} ${socialText}
                    </p>
                  </td>
                </tr>
              </table>`
}

// ============= CALENDAR LINK HELPER =============

function generateCalendarLink(params: {
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
}): string {
  const { eventName, eventDay, eventTime, eventLocation } = params

  const { hours, minutes } = parseTimeString(eventTime)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(hours, minutes, 0, 0)

  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const startDate = formatDate(tomorrow)
  const endDate = formatDate(new Date(tomorrow.getTime() + 90 * 60 * 1000))

  const calendarUrl = new URL('https://www.google.com/calendar/render')
  calendarUrl.searchParams.set('action', 'TEMPLATE')
  calendarUrl.searchParams.set('text', eventName)
  calendarUrl.searchParams.set('dates', `${startDate}/${endDate}`)
  calendarUrl.searchParams.set('details', `Experience via SweatBuddies\n\n${BASE_URL}`)
  calendarUrl.searchParams.set('location', eventLocation)

  return calendarUrl.toString()
}
