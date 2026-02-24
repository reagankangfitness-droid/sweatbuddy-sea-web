import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const COOLDOWN_DAYS = 14
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/**
 * POST /api/host/reengagement/send
 * Sends the nudge email and logs it for cooldown tracking.
 * Body: { recipientEmail, recipientName, subject, message }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientEmail, recipientName, subject, message } = await request.json()

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'recipientEmail, subject, and message are required' },
        { status: 400 }
      )
    }

    // Check cooldown
    const cooldownCutoff = new Date()
    cooldownCutoff.setDate(cooldownCutoff.getDate() - COOLDOWN_DAYS)

    const recentNudge = await prisma.reengagementNudge.findFirst({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        recipientEmail: { equals: recipientEmail, mode: 'insensitive' },
        sentAt: { gte: cooldownCutoff },
      },
    })

    if (recentNudge) {
      return NextResponse.json(
        { error: 'A nudge was already sent to this member recently. Please wait before sending another.' },
        { status: 429 }
      )
    }

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const hostName = session.name || session.instagramHandle

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 16px;">
              <div style="white-space: pre-wrap; line-height: 1.7; color: #334155; font-size: 15px;">
                ${escapeHtml(message).replace(/\n/g, '<br>')}
              </div>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #334155; font-size: 15px; font-weight: 600;">
                  ${escapeHtml(hostName)}
                </p>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">
                  @${escapeHtml(session.instagramHandle)} via SweatBuddies
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; text-align: center;">
              <a href="${BASE_URL}" style="color: #64748b; text-decoration: none; font-size: 12px;">
                sweatbuddies.co
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()

    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      replyTo: session.email,
      tags: [
        { name: 'type', value: 'reengagement_nudge' },
        { name: 'host', value: session.instagramHandle },
      ],
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the nudge
    await prisma.reengagementNudge.create({
      data: {
        organizerInstagram: session.instagramHandle,
        recipientEmail,
        recipientName: recipientName || null,
        subject,
        message,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reengagement send error:', error)
    return NextResponse.json(
      { error: 'Failed to send nudge' },
      { status: 500 }
    )
  }
}
