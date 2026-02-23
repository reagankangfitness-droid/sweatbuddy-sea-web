import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBatchEmails } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Verify host owns this event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.organizerInstagram || !session.instagramHandle ||
        event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const recap = await prisma.eventRecap.findUnique({
      where: { eventSubmissionId: eventId },
    })

    if (!recap) {
      return NextResponse.json({ error: 'Recap not found' }, { status: 404 })
    }

    return NextResponse.json({ recap })
  } catch (error) {
    console.error('Get recap error:', error)
    return NextResponse.json({ error: 'Failed to fetch recap' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const { recapText, photoUrl, hostNotes, attendeeCount } = await request.json()

    if (!recapText || !attendeeCount) {
      return NextResponse.json(
        { error: 'Recap text and attendee count are required' },
        { status: 400 }
      )
    }

    // Verify host owns this event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        organizerInstagram: true,
        slug: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.organizerInstagram || !session.instagramHandle ||
        event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert the recap
    const recap = await prisma.eventRecap.upsert({
      where: { eventSubmissionId: eventId },
      update: {
        recapText,
        photoUrl: photoUrl || null,
        hostNotes: hostNotes || null,
        attendeeCount,
      },
      create: {
        eventSubmissionId: eventId,
        recapText,
        photoUrl: photoUrl || null,
        hostNotes: hostNotes || null,
        attendeeCount,
      },
    })

    // Send email to all attendees
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        email: true,
        name: true,
      },
    })

    if (attendees.length > 0) {
      const escapeHtml = (str: string) =>
        str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

      const eventUrl = `https://www.sweatbuddies.co/event/${event.slug || event.id}`

      const emails = attendees.map((attendee) => {
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #171717; font-size: 20px; margin-bottom: 16px;">
              Thanks for coming to ${escapeHtml(event.eventName)}!
            </h2>
            ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="Event recap" style="width: 100%; max-width: 560px; border-radius: 12px; margin-bottom: 16px;" />` : ''}
            <p style="color: #404040; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
              ${escapeHtml(recapText)}
            </p>
            <div style="margin-top: 24px;">
              <a href="${eventUrl}" style="display: inline-block; padding: 12px 24px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Event Page
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
            <p style="color: #737373; font-size: 14px;">
              This recap was shared by @${escapeHtml(session.instagramHandle)} via SweatBuddies.
            </p>
            <p style="color: #a3a3a3; font-size: 12px; margin-top: 16px;">
              <a href="https://www.sweatbuddies.co" style="color: #737373;">SweatBuddies</a> - Community Fitness Events
            </p>
          </div>
        `

        return {
          to: attendee.email,
          subject: `Thanks for coming to ${event.eventName}!`,
          html,
          tags: [
            { name: 'type', value: 'event-recap' },
            { name: 'event_id', value: eventId },
          ],
        }
      })

      const results = await sendBatchEmails(emails)
      const failed = results.filter((r) => !r.success).length
      if (failed > 0) {
        console.error(`[recap] Failed to send ${failed} recap emails for event ${eventId}`)
      }

      // Mark email as sent
      await prisma.eventRecap.update({
        where: { id: recap.id },
        data: { emailSent: true },
      })
    }

    return NextResponse.json({ success: true, recap })
  } catch (error) {
    console.error('Publish recap error:', error)
    return NextResponse.json({ error: 'Failed to publish recap' }, { status: 500 })
  }
}
