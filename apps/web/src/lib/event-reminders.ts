import { prisma } from './prisma'
import { sendEmail, generateMapsLink } from './email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/**
 * Schedule a reminder for an attendee 24 hours before the event
 */
export async function scheduleEventReminder(params: {
  attendanceId: string
  eventId: string
  eventDate: Date | null
}): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  const { attendanceId, eventId, eventDate } = params

  // Can't schedule reminder if no event date
  if (!eventDate) {
    return { success: false, error: 'No event date provided' }
  }

  // Calculate 24 hours before event
  const scheduledFor = new Date(eventDate)
  scheduledFor.setHours(scheduledFor.getHours() - 24)

  // Don't schedule if already in the past
  if (scheduledFor <= new Date()) {
    return { success: false, error: 'Event is too soon for reminder' }
  }

  try {
    // Check if reminder already exists for this attendance
    const existing = await prisma.eventReminder.findUnique({
      where: { attendanceId },
    })

    if (existing) {
      return { success: true, reminderId: existing.id }
    }

    // Create the reminder
    const reminder = await prisma.eventReminder.create({
      data: {
        attendanceId,
        eventId,
        scheduledFor,
        status: 'PENDING',
      },
    })

    console.log('Scheduled event reminder:', {
      reminderId: reminder.id,
      attendanceId,
      eventId,
      scheduledFor: scheduledFor.toISOString(),
    })

    return { success: true, reminderId: reminder.id }
  } catch (error) {
    console.error('Failed to schedule reminder:', error)
    return { success: false, error: 'Failed to schedule reminder' }
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

  console.log(`Cancelled ${result.count} reminders for event ${eventId}`)
  return { count: result.count }
}

/**
 * Process all due reminders (called by cron job)
 * Returns stats about processed reminders
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
    take: 50, // Process in batches
  })

  console.log(`Processing ${dueReminders.length} due reminders`)

  for (const reminder of dueReminders) {
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
          paymentStatus: true,
        },
      })

      // Skip if attendance no longer exists or is cancelled
      if (!attendance) {
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { status: 'SKIPPED', errorMessage: 'Attendance not found' },
        })
        stats.skipped++
        continue
      }

      // Get event details
      const event = await prisma.eventSubmission.findUnique({
        where: { id: reminder.eventId },
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

      // Skip if event no longer exists or is cancelled
      if (!event || event.status === 'CANCELLED') {
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { status: 'SKIPPED', errorMessage: 'Event cancelled or not found' },
        })
        stats.skipped++
        continue
      }

      // Send the reminder email
      const emailResult = await sendEventReminderEmail({
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
      })

      if (emailResult.success) {
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
        stats.sent++
        console.log(`Sent reminder to ${attendance.email} for event ${event.eventName}`)
      } else {
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED', errorMessage: emailResult.error },
        })
        stats.failed++
        console.error(`Failed to send reminder to ${attendance.email}:`, emailResult.error)
      }
    } catch (error) {
      // Mark as failed
      await prisma.eventReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      stats.failed++
      console.error(`Error processing reminder ${reminder.id}:`, error)
    }
  }

  console.log('Reminder processing complete:', stats)
  return stats
}

// ============= REMINDER EMAIL TEMPLATE =============

interface EventReminderEmailParams {
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
}

/**
 * Send reminder email 24 hours before the event
 */
export async function sendEventReminderEmail(
  params: EventReminderEmailParams
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
  } = params

  const displayName = attendeeName || 'there'
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`
  const mapsLink = generateMapsLink({ address: eventLocation })

  // Format the event date nicely
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-SG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : eventDay

  // Generate Google Calendar link
  const calendarLink = generateCalendarLink({
    eventName,
    eventDay: formattedDate,
    eventTime,
    eventLocation,
  })

  const instagramLink = organizerInstagram
    ? `https://instagram.com/${organizerInstagram.replace('@', '')}`
    : null

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Tomorrow!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🏃</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                See You Tomorrow!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your event is coming up
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
                Just a friendly reminder that you're signed up for <strong>${eventName}</strong> tomorrow!
              </p>

              <!-- Event Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 22px; font-weight: 700;">
                      ${eventName}
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
                          <strong>${eventTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #3730a3; font-size: 15px;">
                          <span style="display: inline-block; width: 24px;">📍</span>
                          <strong>${eventLocation}</strong>
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
                      🗺️ Get Directions
                    </a>
                  </td>
                </tr>
              </table>

              ${communityLink ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${communityLink}" style="display: inline-block; padding: 14px 28px; background-color: ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '#25D366' : '#0088cc'}; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      💬 Join Group Chat
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
                      📅 Add to Calendar
                    </a>
                    ${instagramLink ? `
                    <a href="${instagramLink}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      📸 @${organizerInstagram}
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Tips -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef9c3; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #854d0e; font-size: 14px; font-weight: 600;">
                      💡 Quick reminders:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #854d0e; font-size: 14px; line-height: 1.8;">
                      <li>Arrive 5-10 minutes early</li>
                      <li>Bring water and a towel</li>
                      <li>Wear comfortable workout clothes</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Can't make it anymore? Let the organizer know by replying to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <a href="${eventUrl}" style="display: inline-block; margin-bottom: 16px; color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">
                View Event Details &rarr;
              </a>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
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

  return sendEmail({
    to,
    subject: `Tomorrow: ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'event_reminder' },
      { name: 'event_id', value: eventId },
    ],
  })
}

// Helper to generate Google Calendar link
function generateCalendarLink(params: {
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
}): string {
  const { eventName, eventDay, eventTime, eventLocation } = params

  // Parse the time (e.g., "7:30 AM" or "7:00 PM")
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

  // Try to parse the date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(hours, minutes, 0, 0)

  // Format for Google Calendar
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const startDate = formatDate(tomorrow)
  const endDate = formatDate(new Date(tomorrow.getTime() + 90 * 60 * 1000)) // 90 min duration

  const calendarUrl = new URL('https://www.google.com/calendar/render')
  calendarUrl.searchParams.set('action', 'TEMPLATE')
  calendarUrl.searchParams.set('text', eventName)
  calendarUrl.searchParams.set('dates', `${startDate}/${endDate}`)
  calendarUrl.searchParams.set('details', `Event via SweatBuddies\n\n${BASE_URL}`)
  calendarUrl.searchParams.set('location', eventLocation)

  return calendarUrl.toString()
}
