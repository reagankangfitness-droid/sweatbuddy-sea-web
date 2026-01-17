import { sendEmail, generateMapsLink } from './email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

// ============= HOST EVENT STATUS NOTIFICATIONS =============

interface EventSubmissionNotificationParams {
  to: string
  hostName: string
  eventName: string
  eventId: string
}

/**
 * Send notification when event is submitted and pending approval
 */
export async function sendEventSubmittedEmail(
  params: EventSubmissionNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const { to, hostName, eventName, eventId } = params
  const displayName = hostName || 'there'
  const dashboardUrl = `${BASE_URL}/host/dashboard`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Submitted!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Event Submitted!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Pending review
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
                Thanks for submitting your event <strong>"${eventName}"</strong> to SweatBuddies!
              </p>

              <!-- Status Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
                    <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      Pending Review
                    </p>
                    <p style="margin: 8px 0 0; color: #a16207; font-size: 14px;">
                      We'll review your event within 24-48 hours
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>What happens next?</strong>
              </p>

              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
                <li>Our team will review your event details</li>
                <li>You'll receive an email once it's approved</li>
                <li>Your event will then be live on SweatBuddies!</li>
              </ul>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #f59e0b; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      View Your Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #f59e0b;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Host your fitness events at
              </p>
              <a href="${BASE_URL}" style="color: #f59e0b; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `Event Submitted: ${eventName} - Pending Review`,
    html,
    tags: [
      { name: 'type', value: 'event_submitted' },
      { name: 'event_id', value: eventId },
    ],
  })
}

interface EventApprovedParams {
  to: string
  hostName: string
  eventName: string
  eventId: string
  eventSlug?: string | null
}

/**
 * Send notification when event is approved
 */
export async function sendEventApprovedEmail(
  params: EventApprovedParams
): Promise<{ success: boolean; error?: string }> {
  const { to, hostName, eventName, eventId, eventSlug } = params
  const displayName = hostName || 'there'
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`
  const dashboardUrl = `${BASE_URL}/host/dashboard`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Approved!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Event Approved!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your event is now live
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
                Great news! Your event <strong>"${eventName}"</strong> has been approved and is now live on SweatBuddies!
              </p>

              <!-- Success Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #d1fae5; border-radius: 12px; border: 1px solid #6ee7b7;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
                    <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                      Your Event is Live!
                    </p>
                    <p style="margin: 8px 0 0; color: #047857; font-size: 14px;">
                      People can now discover and join your event
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Next steps:</strong>
              </p>

              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
                <li>Share your event link with your community</li>
                <li>Track RSVPs from your dashboard</li>
                <li>Get notified when people join</li>
              </ul>

              <!-- Action Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${eventUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      View Your Event
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #f3f4f6; color: #374151; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Share Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">
                      📤 Share your event:
                    </p>
                    <p style="margin: 0; color: #10b981; font-size: 14px; word-break: break-all;">
                      ${eventUrl}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #10b981;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Host your fitness events at
              </p>
              <a href="${BASE_URL}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `🎉 Event Approved: ${eventName} is now live!`,
    html,
    tags: [
      { name: 'type', value: 'event_approved' },
      { name: 'event_id', value: eventId },
    ],
  })
}

interface EventRejectedParams {
  to: string
  hostName: string
  eventName: string
  eventId: string
  rejectionReason?: string | null
}

/**
 * Send notification when event is rejected
 */
export async function sendEventRejectedEmail(
  params: EventRejectedParams
): Promise<{ success: boolean; error?: string }> {
  const { to, hostName, eventName, eventId, rejectionReason } = params
  const displayName = hostName || 'there'
  const submitUrl = `${BASE_URL}/host`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Not Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Event Not Approved
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                We need a few changes
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for submitting your event <strong>"${eventName}"</strong>. Unfortunately, we weren't able to approve it at this time.
              </p>

              ${rejectionReason ? `
              <!-- Reason Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">
                      Reason:
                    </p>
                    <p style="margin: 0; color: #dc2626; font-size: 15px; line-height: 1.6;">
                      ${rejectionReason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>What you can do:</strong>
              </p>

              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
                <li>Review the feedback above</li>
                <li>Make the necessary changes</li>
                <li>Resubmit your event</li>
              </ul>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${submitUrl}" style="display: inline-block; padding: 14px 28px; background-color: #374151; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Submit Again
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Need help? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #6b7280;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Host your fitness events at
              </p>
              <a href="${BASE_URL}" style="color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `Event Update: ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'event_rejected' },
      { name: 'event_id', value: eventId },
    ],
  })
}

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

// ============= HOST NEW ATTENDEE NOTIFICATION =============

interface HostNewAttendeeParams {
  to: string
  hostName: string | null
  eventId: string
  eventName: string
  eventSlug?: string | null
  attendeeName: string | null
  attendeeEmail: string
  currentAttendeeCount: number
}

/**
 * Send notification to host when someone joins their event (free or PayNow)
 */
export async function sendHostNewAttendeeNotification(
  params: HostNewAttendeeParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    hostName,
    eventId,
    eventName,
    eventSlug,
    attendeeName,
    attendeeEmail,
    currentAttendeeCount,
  } = params

  const displayHostName = hostName || 'there'
  const displayAttendeeName = attendeeName || attendeeEmail.split('@')[0]
  const dashboardUrl = `${BASE_URL}/host/events/${eventId}/attendees`
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Attendee!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                New Attendee!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Someone just joined your event
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
                <strong>${displayAttendeeName}</strong> just signed up for <strong>${eventName}</strong>!
              </p>

              <!-- Attendee Info Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Name:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          ${displayAttendeeName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          ${attendeeEmail}
                        </td>
                      </tr>
                      <tr style="background-color: #10b981;">
                        <td style="padding: 12px; color: white; font-size: 14px; font-weight: 600; border-radius: 0 0 0 8px;">
                          Total Attendees:
                        </td>
                        <td style="padding: 12px; color: white; font-size: 20px; font-weight: 700; text-align: right; border-radius: 0 0 8px 0;">
                          ${currentAttendeeCount}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      View Attendees
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${eventUrl}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500;">
                      View Event Page →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Keep up the great work! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Manage your events at
              </p>
              <a href="${BASE_URL}/host/dashboard" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `🎉 ${displayAttendeeName} joined ${eventName}!`,
    html,
    tags: [
      { name: 'type', value: 'host_new_attendee' },
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

// ============= WAITLIST NOTIFICATIONS =============

interface WaitlistSpotAvailableParams {
  to: string
  userName: string | null
  eventName: string
  eventUrl: string
  expiresAt: Date
}

/**
 * Send notification when a spot opens up for someone on the waitlist
 */
export async function sendWaitlistSpotAvailableEmail(
  params: WaitlistSpotAvailableParams
): Promise<{ success: boolean; error?: string }> {
  const { to, userName, eventName, eventUrl, expiresAt } = params
  const displayName = userName || 'there'

  // Format expiry time
  const expiryTime = expiresAt.toLocaleString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Spot Opened Up!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                A Spot Opened Up!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Quick, claim your spot
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
                Good news! A spot just opened up for <strong>${eventName}</strong> and you're first in line on the waitlist!
              </p>

              <!-- Urgency Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
                    <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      Claim your spot before
                    </p>
                    <p style="margin: 8px 0 0; color: #b45309; font-size: 18px; font-weight: 700;">
                      ${expiryTime}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6;">
                After this time, the spot will be offered to the next person on the waitlist.
              </p>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${eventUrl}" style="display: inline-block; padding: 16px 32px; background-color: #f59e0b; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Claim My Spot Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #f59e0b;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
              </p>
              <a href="${BASE_URL}" style="color: #f59e0b; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `A spot opened up for ${eventName}!`,
    html,
    tags: [{ name: 'type', value: 'waitlist_spot_available' }],
  })
}

// ============= PAYMENT VERIFICATION EMAILS =============

interface PaymentVerifiedParams {
  to: string
  attendeeName: string | null
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
  amountPaid: number // in cents
  currency?: string
  organizerInstagram?: string | null
  communityLink?: string | null
  eventSlug?: string | null
  eventId: string
}

/**
 * Send email when host verifies a PayNow payment
 */
export async function sendPaymentVerifiedEmail(
  params: PaymentVerifiedParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    amountPaid,
    currency = 'SGD',
    organizerInstagram,
    communityLink,
    eventSlug,
    eventId,
  } = params

  const displayName = attendeeName || 'there'
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`
  const mapsLink = generateMapsLink({ address: eventLocation })

  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
  }).format(amountPaid / 100)

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
  <title>Payment Verified!</title>
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
                Payment Verified!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                You're confirmed for the event
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
                Great news! The host has verified your payment of <strong>${formattedAmount}</strong> for <strong>${eventName}</strong>.
              </p>

              <!-- Success Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #d1fae5; border-radius: 12px; border: 1px solid #6ee7b7;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                      Your spot is confirmed!
                    </p>
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

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #10b981;">@_sweatbuddies</a>
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
    subject: `Payment Verified: ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'payment_verified' },
      { name: 'event_id', value: eventId },
    ],
  })
}

interface PaymentRejectedParams {
  to: string
  attendeeName: string | null
  eventName: string
  eventId: string
  eventSlug?: string | null
  amountAttempted: number // in cents
  currency?: string
  rejectionReason?: string | null
}

/**
 * Send email when host rejects a PayNow payment
 */
export async function sendPaymentRejectedEmail(
  params: PaymentRejectedParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventName,
    eventId,
    eventSlug,
    amountAttempted,
    currency = 'SGD',
    rejectionReason,
  } = params

  const displayName = attendeeName || 'there'
  const eventUrl = eventSlug ? `${BASE_URL}/e/${eventSlug}` : `${BASE_URL}/e/${eventId}`

  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
  }).format(amountAttempted / 100)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Not Verified</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Payment Not Verified
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Action required
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Unfortunately, the host couldn't verify your payment of <strong>${formattedAmount}</strong> for <strong>${eventName}</strong>.
              </p>

              ${rejectionReason ? `
              <!-- Reason Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                      Reason:
                    </p>
                    <p style="margin: 0; color: #b45309; font-size: 15px; line-height: 1.6;">
                      ${rejectionReason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>What you can do:</strong>
              </p>

              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
                <li>Double-check your PayNow reference number</li>
                <li>Make sure you transferred the correct amount</li>
                <li>Try registering again with the correct details</li>
              </ul>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${eventUrl}" style="display: inline-block; padding: 14px 28px; background-color: #f59e0b; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Try Again
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Need help? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #f59e0b;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
              </p>
              <a href="${BASE_URL}" style="color: #f59e0b; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `Payment Not Verified: ${eventName}`,
    html,
    tags: [
      { name: 'type', value: 'payment_rejected' },
      { name: 'event_id', value: eventId },
    ],
  })
}

// ============= EVENT CANCELLED BY HOST =============

interface EventCancelledByHostParams {
  to: string
  attendeeName: string | null
  eventName: string
  eventDay: string
  eventTime: string
  eventLocation: string
  cancellationReason?: string | null
  hostInstagram?: string | null
  // Payment info
  wasPaid: boolean
  paymentAmount?: number | null
  paymentMethod?: 'stripe' | 'paynow' | null
  refundStatus?: 'auto_refunded' | 'pending_manual' | null
}

/**
 * Send email when host cancels an event
 */
export async function sendEventCancelledByHostEmail(
  params: EventCancelledByHostParams
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    attendeeName,
    eventName,
    eventDay,
    eventTime,
    eventLocation,
    cancellationReason,
    hostInstagram,
    wasPaid,
    paymentAmount,
    paymentMethod,
    refundStatus,
  } = params

  const displayName = attendeeName || 'there'

  const formattedAmount = paymentAmount
    ? new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(paymentAmount / 100)
    : null

  const instagramLink = hostInstagram
    ? `https://instagram.com/${hostInstagram.replace('@', '')}`
    : null

  const refundMessage = wasPaid
    ? refundStatus === 'auto_refunded'
      ? `<p style="margin: 0; color: #065f46; font-size: 15px;">✅ Your payment of ${formattedAmount} has been automatically refunded to your original payment method.</p>`
      : `<p style="margin: 0; color: #92400e; font-size: 15px;">💰 For your refund of ${formattedAmount}, please contact the host ${hostInstagram ? `(@${hostInstagram})` : ''} directly via ${paymentMethod === 'paynow' ? 'PayNow' : 'the original payment method'}.</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Event Cancelled
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Sorry about that
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${displayName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Unfortunately, <strong>${eventName}</strong> has been cancelled by the host.
              </p>

              <!-- Event Details (for reference) -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f3f4f6; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Cancelled Event
                    </p>
                    <h3 style="margin: 0 0 12px; color: #374151; font-size: 18px; font-weight: 600; text-decoration: line-through;">
                      ${eventName}
                    </h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      ${eventDay} · ${eventTime} · ${eventLocation}
                    </p>
                  </td>
                </tr>
              </table>

              ${cancellationReason ? `
              <!-- Reason Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #475569; font-size: 14px; font-weight: 600;">
                      Reason from host:
                    </p>
                    <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">
                      "${cancellationReason}"
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${wasPaid ? `
              <!-- Refund Info -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: ${refundStatus === 'auto_refunded' ? '#d1fae5' : '#fef3c7'}; border-radius: 12px; border: 1px solid ${refundStatus === 'auto_refunded' ? '#6ee7b7' : '#fcd34d'};">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: ${refundStatus === 'auto_refunded' ? '#065f46' : '#92400e'}; font-size: 14px; font-weight: 600;">
                      💳 Refund Information
                    </p>
                    ${refundMessage}
                  </td>
                </tr>
              </table>
              ` : ''}

              ${instagramLink ? `
              <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6;">
                Questions about this cancellation? Contact the host: <a href="${instagramLink}" style="color: #3477f8;">@${hostInstagram}</a>
              </p>
              ` : ''}

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${BASE_URL}" style="display: inline-block; padding: 14px 28px; background-color: #3477f8; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Browse Other Events
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                We hope to see you at another event soon! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Find more events at
              </p>
              <a href="${BASE_URL}" style="color: #3477f8; text-decoration: none; font-size: 14px; font-weight: 600;">
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
    subject: `Event Cancelled: ${eventName}`,
    html,
    tags: [{ name: 'type', value: 'event_cancelled_by_host' }],
  })
}

// ============= ORIGINAL EVENT CONFIRMATION =============

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
  checkInCode?: string // QR code check-in
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
    checkInCode,
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

  // Generate check-in URL if code provided
  const checkInUrl = checkInCode ? `${BASE_URL}/checkin/${checkInCode}` : undefined

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
    checkInUrl,
    checkInCode,
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
  checkInUrl?: string
  checkInCode?: string
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
    checkInUrl,
    checkInCode,
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

              ${checkInUrl ? `
              <!-- Check-in QR Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 16px; color: #166534; font-size: 14px; font-weight: 600;">
                      📱 Your Check-in Pass
                    </p>
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(checkInUrl)}"
                      alt="Check-in QR Code"
                      width="150"
                      height="150"
                      style="display: block; margin: 0 auto 12px; border-radius: 8px;"
                    />
                    <p style="margin: 0 0 8px; color: #15803d; font-size: 13px;">
                      Show this at check-in
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 11px; font-family: monospace;">
                      Code: ${checkInCode}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

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

// ============= REFUND NOTIFICATION EMAIL =============

interface RefundNotificationParams {
  to: string
  userName: string | null
  eventName: string
  refundAmount: number
  currency: string
  refundType: 'full' | 'partial'
  reason?: string
}

/**
 * Send notification email when a refund is processed
 */
export async function sendRefundNotificationEmail(
  params: RefundNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const { to, userName, eventName, refundAmount, currency, refundType, reason } = params

  const displayName = userName || 'there'
  const formattedAmount = `${currency.toUpperCase()} ${(refundAmount / 100).toFixed(2)}`
  const supportUrl = `${BASE_URL}/support`
  const myBookingsUrl = `${BASE_URL}/my-bookings`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">💸</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Refund Processed
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${refundType === 'full' ? 'Full refund' : 'Partial refund'} completed
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
                Good news! Your refund for <strong>"${eventName}"</strong> has been processed.
              </p>

              <!-- Refund Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #d1fae5; border-radius: 12px; border: 1px solid #6ee7b7;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 500;">
                      Refund Amount
                    </p>
                    <p style="margin: 0; color: #047857; font-size: 32px; font-weight: 700;">
                      ${formattedAmount}
                    </p>
                    <p style="margin: 12px 0 0; color: #065f46; font-size: 14px;">
                      ✅ ${refundType === 'full' ? 'Full refund' : 'Partial refund'}
                    </p>
                  </td>
                </tr>
              </table>

              ${reason ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #f0f9ff; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 4px; color: #0369a1; font-size: 13px; font-weight: 600;">
                      Reason
                    </p>
                    <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                      ${reason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px; background-color: #fef3c7; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⏳ Processing time:</strong> The refund will appear in your account within 5-10 business days, depending on your bank or card issuer.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${myBookingsUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px; margin-right: 12px;">
                      View My Bookings
                    </a>
                    <a href="${BASE_URL}" style="display: inline-block; padding: 14px 28px; background-color: #f4f4f5; color: #374151; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Browse Events
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Have questions? <a href="${supportUrl}" style="color: #10b981; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                SweatBuddies
              </p>
              <a href="${BASE_URL}" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                You received this email because you had a booking on SweatBuddies.
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

  const result = await sendEmail({
    to,
    subject: `Refund Processed: ${formattedAmount} for ${eventName}`,
    html,
    text: `
Hey ${displayName},

Good news! Your refund for "${eventName}" has been processed.

Refund Amount: ${formattedAmount}
Type: ${refundType === 'full' ? 'Full refund' : 'Partial refund'}
${reason ? `Reason: ${reason}` : ''}

The refund will appear in your account within 5-10 business days, depending on your bank or card issuer.

View your bookings: ${myBookingsUrl}
Need help? ${supportUrl}

- SweatBuddies Team
    `.trim(),
    tags: [
      { name: 'type', value: 'refund_notification' },
    ],
  })

  return result
}
