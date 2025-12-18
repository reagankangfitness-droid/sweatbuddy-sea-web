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

    // Check if organizer exists
    const organizer = await prisma.organizer.findUnique({
      where: { email: normalizedEmail },
    })

    if (!organizer) {
      return NextResponse.json(
        { error: 'No organizer found with this email. Please register first.' },
        { status: 404 }
      )
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Delete any existing tokens for this email
    await prisma.organizerMagicLink.deleteMany({
      where: { email: normalizedEmail },
    })

    // Create new magic link token
    await prisma.organizerMagicLink.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    })

    const magicLink = `${BASE_URL}/organizer/${token}`

    // Send magic link email
    console.log(`[Organizer Login] Sending magic link to ${normalizedEmail}`)
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Your SweatBuddies Organizer Login Link',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #1800ad 0%, #3477f8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                Organizer Dashboard
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey @${organizer.instagramHandle}!
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to access your organizer dashboard where you can view your events, attendees, and chat with them directly.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; padding: 16px 32px; background-color: #1800ad; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Access Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This link expires in 7 days. Bookmark it for easy access!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
      tags: [{ name: 'type', value: 'organizer_magic_link' }],
    })

    if (!emailResult.success) {
      console.error(`[Organizer Login] Email failed for ${normalizedEmail}:`, emailResult.error)
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    console.log(`[Organizer Login] Magic link sent successfully to ${normalizedEmail}, messageId: ${emailResult.messageId}`)

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    })
  } catch (error) {
    console.error('Organizer login error:', error)
    return NextResponse.json(
      { error: 'Failed to send login link' },
      { status: 500 }
    )
  }
}
