import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'
import eventsData from '@/data/events.json'

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

    // Get all RSVPs for this email
    const attendances = await prisma.eventAttendance.findMany({
      where: { email: normalizedEmail },
      orderBy: { timestamp: 'desc' },
    })

    if (attendances.length === 0) {
      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        events: [],
        message: 'No events found for this email.',
      })
    }

    // Get event details from static data and approved submissions
    const staticEvents = eventsData.events
    const approvedSubmissions = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
    })

    // Enrich attendance records with event details
    const enrichedEvents = attendances.map((attendance) => {
      // Check static events first
      const staticEvent = staticEvents.find((e) => e.id === attendance.eventId)
      if (staticEvent) {
        return {
          id: attendance.id,
          eventId: attendance.eventId,
          eventName: attendance.eventName,
          rsvpDate: attendance.timestamp,
          event: {
            id: staticEvent.id,
            name: staticEvent.name,
            category: staticEvent.category,
            day: staticEvent.day,
            time: staticEvent.time,
            location: staticEvent.location,
            organizer: staticEvent.organizer,
            imageUrl: staticEvent.imageUrl || null,
            recurring: staticEvent.recurring,
            communityLink: (staticEvent as any).communityLink || null,
          },
        }
      }

      // Check approved submissions
      const submissionId = attendance.eventId.replace('submission-', '')
      const submission = approvedSubmissions.find((s) => s.id === submissionId)
      if (submission) {
        return {
          id: attendance.id,
          eventId: attendance.eventId,
          eventName: attendance.eventName,
          rsvpDate: attendance.timestamp,
          event: {
            id: `submission-${submission.id}`,
            name: submission.eventName,
            category: submission.category,
            day: submission.day,
            eventDate: submission.eventDate?.toISOString() || null,
            time: submission.time,
            location: submission.location,
            organizer: submission.organizerInstagram,
            imageUrl: submission.imageUrl || null,
            recurring: submission.recurring,
            communityLink: submission.communityLink || null,
          },
        }
      }

      // Event not found (might have been removed)
      return {
        id: attendance.id,
        eventId: attendance.eventId,
        eventName: attendance.eventName,
        rsvpDate: attendance.timestamp,
        event: null,
      }
    })

    // Also send a magic link email for future convenience (fire and forget)
    sendMagicLinkEmail(normalizedEmail).catch((err) => {
      console.error('Failed to send magic link email:', err)
    })

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      events: enrichedEvents,
    })
  } catch (error) {
    console.error('My events error:', error)
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    )
  }
}

async function sendMagicLinkEmail(email: string) {
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Delete any existing tokens for this email
  await prisma.magicLinkToken.deleteMany({
    where: { email },
  })

  // Create new token
  await prisma.magicLinkToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  })

  const magicLink = `${BASE_URL}/my-events/${token}`

  await sendEmail({
    to: email,
    subject: 'Your SweatBuddies Events Link',
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
            <td style="padding: 32px; background: linear-gradient(135deg, #3477f8 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                Your Events Link
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Bookmark this link to quickly access your SweatBuddies experiences anytime:
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; padding: 16px 32px; background-color: #3477f8; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View My Experiences
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This link expires in 7 days.
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
    tags: [{ name: 'type', value: 'magic_link' }],
  })
}
