import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const ADMIN_EMAIL = 'reagankangfitness@gmail.com' // Change to your email

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      organizerName,
      instagramHandle,
      email,
      eventName,
      eventType,
      eventDay,
      eventTime,
      location,
      description,
    } = body

    // Validate required fields
    if (!organizerName || !instagramHandle || !email || !eventName || !eventType || !eventDay || !eventTime || !location) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Normalize Instagram handle (remove @ if present)
    const normalizedInstagram = instagramHandle.replace('@', '').toLowerCase().trim()

    // Create host application
    const application = await prisma.hostApplication.create({
      data: {
        organizerName: organizerName.trim(),
        instagramHandle: normalizedInstagram,
        email: email.toLowerCase().trim(),
        eventName: eventName.trim(),
        eventType,
        eventDay: eventDay.trim(),
        eventTime: eventTime.trim(),
        location: location.trim(),
        description: description?.trim() || null,
      },
    })

    // Send notification email to admin
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Host Application: ${eventName}`,
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
            <td style="padding: 24px; background-color: #E07A5F; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                New Host Application 🎉
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 0 0 16px 16px;">
              <h2 style="margin: 0 0 20px; color: #1B4332; font-size: 20px;">${eventName}</h2>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Organizer:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px; font-weight: 600;">${organizerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Instagram:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">
                    <a href="https://instagram.com/${normalizedInstagram}" style="color: #E07A5F;">@${normalizedInstagram}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">
                    <a href="mailto:${email}" style="color: #E07A5F;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Event Type:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">${eventType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Day & Time:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">${eventDay} at ${eventTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Location:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">${location}</td>
                </tr>
                ${description ? `
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-size: 14px; vertical-align: top;">Description:</td>
                  <td style="padding: 8px 0; color: #1B4332; font-size: 14px;">${description}</td>
                </tr>
                ` : ''}
              </table>

              <p style="margin: 0; color: #6B7280; font-size: 12px; text-align: center;">
                Application ID: ${application.id}
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
      tags: [{ name: 'type', value: 'host_application' }],
    }).catch((error) => {
      console.error('Failed to send admin notification:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
    })
  } catch (error) {
    console.error('Host application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    )
  }
}
