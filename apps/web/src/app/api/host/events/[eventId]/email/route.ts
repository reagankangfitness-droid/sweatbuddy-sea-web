import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBatchEmails } from '@/lib/email'

export const dynamic = 'force-dynamic'

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
    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
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
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all attendees for this event
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        email: true,
        name: true,
      },
    })

    if (attendees.length === 0) {
      return NextResponse.json(
        { error: 'No attendees to email' },
        { status: 400 }
      )
    }

    // Prepare emails with {name} placeholder replacement
    const emails = attendees.map((attendee) => {
      const personalizedMessage = message.replace(
        /\{name\}/gi,
        attendee.name || 'there'
      )

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #171717;">
            ${personalizedMessage.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
          <p style="color: #737373; font-size: 14px;">
            This email was sent by @${session.instagramHandle} via SweatBuddies regarding "${event.eventName}".
          </p>
          <p style="color: #a3a3a3; font-size: 12px; margin-top: 16px;">
            <a href="https://www.sweatbuddies.co" style="color: #737373;">SweatBuddies</a> - Community Fitness Events
          </p>
        </div>
      `

      return {
        to: attendee.email,
        subject,
        html,
        replyTo: `${session.instagramHandle}@instagram.com`, // Allows replies to go to host
        tags: [
          { name: 'type', value: 'host-email' },
          { name: 'event_id', value: eventId },
        ],
      }
    })

    // Send all emails
    const results = await sendBatchEmails(emails)

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    if (failed > 0) {
      console.error(`Failed to send ${failed} emails for event ${eventId}`)
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: attendees.length,
    })
  } catch (error) {
    console.error('Email attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
