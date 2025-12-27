import { sendEmail, generateMapsLink } from './email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'

// ============= PAID EVENT CONFIRMATION =============

interface PaidEventConfirmationParams {
  to: string
  attendeeName: string
  eventId: string
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
  organizerInstagram?: string
  communityLink?: string | null
  // Payment details
  amountPaid: number // in cents
  currency: string
  ticketQuantity: number
  stripePaymentId?: string | null
}

/**
 * Send confirmation email for paid event bookings
 */
export async function sendPaidEventConfirmationEmail(
  params: PaidEventConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventId,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    organizerInstagram,
    communityLink,
    amountPaid,
    currency,
    ticketQuantity,
    stripePaymentId,
  } = params

  const displayName = attendeeName || 'there'
  const eventUrl = `${BASE_URL}/e/${eventId}`
  const mapsLink = generateMapsLink({ address: eventLocation })

  // Format amount (convert from cents to dollars)
  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency || 'SGD',
  }).format(amountPaid / 100)

  // Generate Google Calendar link
  const calendarLink = generateEventCalendarLink({
    eventName,
    eventDay,
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
  <title>Payment Confirmed!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Payment Confirmed!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                You're all set for the event
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
                Your payment has been processed successfully. Here's your confirmation:
              </p>

              <!-- Payment Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Amount Paid:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 18px; font-weight: 700; text-align: right;">
                          ${formattedAmount}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Tickets:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          ${ticketQuantity} ${ticketQuantity === 1 ? 'ticket' : 'tickets'}
                        </td>
                      </tr>
                      ${stripePaymentId ? `
                      <tr>
                        <td colspan="2" style="padding: 8px 0 0; color: #6b7280; font-size: 12px; border-top: 1px solid #bbf7d0;">
                          Reference: ${stripePaymentId.slice(-12).toUpperCase()}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 22px; font-weight: 700;">
                      ${eventName}
                    </h2>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                          <span style="display: inline-block; width: 24px;">📅</span>
                          <strong style="color: #0f172a;">${eventDay}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                          <span style="display: inline-block; width: 24px;">🕐</span>
                          <strong style="color: #0f172a;">${eventTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px;">
                          <span style="display: inline-block; width: 24px;">📍</span>
                          <strong style="color: #0f172a;">${eventLocation}</strong>
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
                    <a href="${calendarLink}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      📅 Add to Calendar
                    </a>
                  </td>
                </tr>
              </table>

              ${communityLink ? `
              <!-- Community Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${communityLink}" style="display: inline-block; padding: 14px 28px; background-color: ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '#25D366' : communityLink.includes('t.me') || communityLink.includes('telegram') ? '#0088cc' : '#10b981'}; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      💬 Join ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? 'WhatsApp' : communityLink.includes('t.me') || communityLink.includes('telegram') ? 'Telegram' : 'Community'} Group
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Quick Links -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${mapsLink}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      🗺️ Get Directions
                    </a>
                    ${instagramLink ? `
                    <a href="${instagramLink}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      📸 Follow Organizer
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
                      💡 Quick tips:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #854d0e; font-size: 14px; line-height: 1.8;">
                      <li>Arrive 5-10 minutes early</li>
                      <li>Bring water and a towel</li>
                      <li>Show this email at check-in if asked</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Need help? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #10b981;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <a href="${eventUrl}" style="display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500;">
                View Event Details &rarr;
              </a>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
              </p>
              <a href="${BASE_URL}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                This is your payment confirmation. Keep this email for your records.
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
    subject: `Payment Confirmed: ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'paid_event_confirmation' },
      { name: 'event_id', value: eventId },
    ],
  })
}

// ============= HOST NOTIFICATION =============

interface HostBookingNotificationParams {
  to: string
  hostName: string
  eventId: string
  eventName: string
  attendeeName: string
  attendeeEmail: string
  amountPaid: number // in cents
  currency: string
  ticketQuantity: number
  hostPayout: number // in cents
}

/**
 * Send notification to host when they receive a new paid booking
 */
export async function sendHostBookingNotificationEmail(
  params: HostBookingNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    hostName,
    eventId,
    eventName,
    attendeeName,
    attendeeEmail,
    amountPaid,
    currency,
    ticketQuantity,
    hostPayout,
  } = params

  const displayHostName = hostName || 'there'
  const dashboardUrl = `${BASE_URL}/host/dashboard`

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency || 'SGD',
  }).format(amountPaid / 100)

  const formattedPayout = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency || 'SGD',
  }).format(hostPayout / 100)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                New Booking!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Someone just booked your event
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayHostName}! 👋
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! You just received a new booking for <strong>${eventName}</strong>.
              </p>

              <!-- Booking Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px; color: #7c3aed; font-size: 16px; font-weight: 600;">
                      Booking Details
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px;">
                          <strong>Attendee:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px; text-align: right;">
                          ${attendeeName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px; text-align: right;">
                          ${attendeeEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px;">
                          <strong>Tickets:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px; text-align: right;">
                          ${ticketQuantity} ${ticketQuantity === 1 ? 'ticket' : 'tickets'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px;">
                          <strong>Amount Paid:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #581c87; font-size: 14px; text-align: right;">
                          ${formattedAmount}
                        </td>
                      </tr>
                      <tr style="background-color: #7c3aed; color: white;">
                        <td style="padding: 12px; font-size: 14px; font-weight: 600; border-radius: 0 0 0 8px;">
                          Your Payout:
                        </td>
                        <td style="padding: 12px; font-size: 18px; font-weight: 700; text-align: right; border-radius: 0 0 8px 0;">
                          ${formattedPayout}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                The payment has been processed and will be transferred to your connected Stripe account according to your payout schedule.
              </p>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #7c3aed; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #7c3aed;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Manage your events at
              </p>
              <a href="${BASE_URL}" style="color: #7c3aed; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                You received this because you're hosting an event on SweatBuddies.
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
    subject: `New Booking: ${attendeeName} for ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'host_booking_notification' },
      { name: 'event_id', value: eventId },
    ],
  })
}

// ============= ORIGINAL EVENT CONFIRMATION =============

interface EventCancellationParams {
  to: string
  userName: string | null
  eventName: string
}

/**
 * Send cancellation email when user removes themselves from an event
 */
export async function sendEventCancellationEmail(
  params: EventCancellationParams
): Promise<{ success: boolean; error?: string }> {
  const { to, userName, eventName } = params
  const displayName = userName || 'there'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background-color: #f1f5f9; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #1B4332; font-size: 24px; font-weight: 700;">
                RSVP Cancelled
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've cancelled your RSVP for <strong>${eventName}</strong>.
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                No worries — we hope to see you at another event soon! 💪
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}" style="display: inline-block; padding: 16px 32px; background-color: #E07A5F; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px;">
                      Browse More Events
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6B7280; font-size: 14px; text-align: center;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #E07A5F;">@_sweatbuddies</a>
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
    subject: `RSVP Cancelled: ${eventName}`,
    html,
    tags: [{ name: 'type', value: 'event_cancellation' }],
  })
}

interface EventConfirmationParams {
  to: string
  userName: string | null
  eventId: string
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
  organizerInstagram?: string
  communityLink?: string | null
}

/**
 * Send confirmation email when user RSVPs to an event
 */
export async function sendEventConfirmationEmail(
  params: EventConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    userName,
    eventId,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    organizerInstagram,
    communityLink,
  } = params

  const displayName = userName || 'there'
  const eventUrl = `${BASE_URL}/e/${eventId}`
  const mapsLink = generateMapsLink({ address: eventLocation })

  // Generate Google Calendar link
  const calendarLink = generateEventCalendarLink({
    eventName,
    eventDay,
    eventTime,
    eventLocation,
  })

  const html = buildConfirmationEmailHtml({
    userName: displayName,
    userEmail: to,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    eventUrl,
    calendarLink,
    mapsLink,
    organizerInstagram,
    communityLink,
  })

  const result = await sendEmail({
    to,
    subject: `You're going to ${eventName}!`,
    html,
    tags: [
      { name: 'type', value: 'event_confirmation' },
      { name: 'event_id', value: eventId },
    ],
  })

  return result
}

/**
 * Generate Google Calendar link for recurring events
 */
function generateEventCalendarLink(params: {
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
}): string {
  const { eventName, eventDay, eventTime, eventLocation } = params

  // Parse the day and time to create a calendar event
  // Events are recurring (e.g., "Tuesdays" at "7:30 PM")
  const dayMap: Record<string, number> = {
    'Sundays': 0,
    'Mondays': 1,
    'Tuesdays': 2,
    'Wednesdays': 3,
    'Thursdays': 4,
    'Fridays': 5,
    'Saturdays': 6,
  }

  const dayOfWeek = dayMap[eventDay]
  const now = new Date()

  // Find the next occurrence of this day
  let targetDate = new Date(now)
  const currentDay = now.getDay()

  if (dayOfWeek !== undefined) {
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
    targetDate.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
  } else {
    // For non-standard days like "Monthly" or "Various", use next week
    targetDate.setDate(now.getDate() + 7)
  }

  // Parse time (e.g., "7:30 PM", "6:30 PM")
  const timeMatch = eventTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i)
  if (timeMatch) {
    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2] || '0')
    const meridiem = timeMatch[3]?.toUpperCase()

    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0

    targetDate.setHours(hours, minutes, 0, 0)
  }

  // End time is 1 hour after start
  const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000)

  const formatForCalendar = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d{3}/g, '')

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', eventName)
  url.searchParams.set('dates', `${formatForCalendar(targetDate)}/${formatForCalendar(endDate)}`)
  url.searchParams.set('details', `Join us at ${eventName}!\n\nFind more events at ${BASE_URL}`)
  url.searchParams.set('location', eventLocation)

  return url.toString()
}

/**
 * Build the HTML email template
 */
function buildConfirmationEmailHtml(params: {
  userName: string
  userEmail: string
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
  eventUrl: string
  calendarLink: string
  mapsLink: string
  organizerInstagram?: string
  communityLink?: string | null
}): string {
  const {
    userName,
    userEmail,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    eventUrl,
    calendarLink,
    mapsLink,
    organizerInstagram,
    communityLink,
  } = params

  const myEventsLink = `${BASE_URL}/my-events?email=${encodeURIComponent(userEmail)}`

  const instagramLink = organizerInstagram
    ? `https://instagram.com/${organizerInstagram.replace('@', '')}`
    : null

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Going!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3477f8 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                You're Going!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                See you at the event
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName}! 👋
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've confirmed your spot. Here are the details:
              </p>

              <!-- Event Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 22px; font-weight: 700;">
                      ${eventName}
                    </h2>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                          <span style="display: inline-block; width: 24px;">📅</span>
                          <strong style="color: #0f172a;">${eventDay}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                          <span style="display: inline-block; width: 24px;">🕐</span>
                          <strong style="color: #0f172a;">${eventTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 15px;">
                          <span style="display: inline-block; width: 24px;">📍</span>
                          <strong style="color: #0f172a;">${eventLocation}</strong>
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
                    <a href="${calendarLink}" style="display: inline-block; padding: 14px 28px; background-color: #3477f8; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      📅 Add to Calendar
                    </a>
                  </td>
                </tr>
              </table>

              ${communityLink ? `
              <!-- Community Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${communityLink}" style="display: inline-block; padding: 14px 28px; background-color: ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? '#25D366' : communityLink.includes('t.me') || communityLink.includes('telegram') ? '#0088cc' : '#3477f8'}; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      💬 Join ${communityLink.includes('whatsapp') || communityLink.includes('wa.me') ? 'WhatsApp' : communityLink.includes('t.me') || communityLink.includes('telegram') ? 'Telegram' : 'Community'} Group
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Quick Links -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${mapsLink}" style="color: #3477f8; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      🗺️ Get Directions
                    </a>
                    ${instagramLink ? `
                    <a href="${instagramLink}" style="color: #3477f8; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">
                      📸 Follow Organizer
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
                      💡 Quick tips:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #854d0e; font-size: 14px; line-height: 1.8;">
                      <li>Arrive 5-10 minutes early</li>
                      <li>Bring water and a towel</li>
                      <li>Introduce yourself to the organizer!</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Can't make it? No worries — just show up next time! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <a href="${myEventsLink}" style="display: inline-block; margin-bottom: 16px; color: #3477f8; text-decoration: none; font-size: 14px; font-weight: 500;">
                View all your upcoming events &rarr;
              </a>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
              </p>
              <a href="${BASE_URL}" style="color: #3477f8; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                You received this email because you signed up for an event on SweatBuddies.
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
