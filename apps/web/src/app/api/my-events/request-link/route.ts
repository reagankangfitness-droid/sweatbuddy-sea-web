import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if this email has any RSVPs
    const attendanceCount = await prisma.eventAttendance.count({
      where: { email: normalizedEmail },
    })

    if (attendanceCount === 0) {
      // Don't reveal if email exists or not - just say we sent it
      return NextResponse.json({
        success: true,
        message: 'If you have any RSVPs, you will receive an email with a link to view them.',
      })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing tokens for this email
    await prisma.magicLinkToken.deleteMany({
      where: { email: normalizedEmail },
    })

    // Create new token
    await prisma.magicLinkToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    })

    // Send email with magic link
    const magicLink = `${BASE_URL}/my-events/${token}`

    await sendEmail({
      to: normalizedEmail,
      subject: 'View Your SweatBuddies Events',
      html: buildMagicLinkEmail({ magicLink, email: normalizedEmail }),
      tags: [{ name: 'type', value: 'magic_link' }],
    })

    return NextResponse.json({
      success: true,
      message: 'Check your email for a link to view your events.',
    })
  } catch (error) {
    console.error('Magic link request error:', error)
    return NextResponse.json(
      { error: 'Failed to send link' },
      { status: 500 }
    )
  }
}

function buildMagicLinkEmail({ magicLink, email }: { magicLink: string; email: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>View Your Events</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3477f8 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                View Your Events
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey there! 👋
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to see all the events you've signed up for on SweatBuddies.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; padding: 16px 32px; background-color: #3477f8; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View My Events
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; text-align: center;">
                This link expires in 24 hours.
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Sent to ${email}
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
