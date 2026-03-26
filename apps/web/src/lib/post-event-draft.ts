import { prisma } from './prisma'
import { sendBatchEmails, type SendEmailOptions } from './email'
import { anthropic, AGENT_MODEL } from './ai/client'
import type { HostSession } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

// ============= CRON: DRAFT POST-EVENT EMAILS =============

/**
 * Called by the midnight cron job.
 * Finds events that ended today, generates an AI-drafted thank-you email for each.
 */
export async function draftPostEventEmails(): Promise<{
  processed: number
  drafted: number
  skipped: number
  failed: number
}> {
  const stats = { processed: 0, drafted: 0, skipped: 0, failed: 0 }

  // Find events whose date is today and are approved
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const todaysEvents = await prisma.eventSubmission.findMany({
    where: {
      status: 'APPROVED',
      eventDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      id: true,
      eventName: true,
      category: true,
      eventDate: true,
      organizerName: true,
      organizerInstagram: true,
      location: true,
      submittedByUserId: true,
    },
  })

  for (const event of todaysEvents) {
    stats.processed++

    try {
      // Skip if draft already exists for this event
      const existing = await prisma.postEventDraft.findUnique({
        where: { eventId: event.id },
      })
      if (existing) {
        stats.skipped++
        continue
      }

      // Get attendee count
      const attendeeCount = await prisma.eventAttendance.count({
        where: { eventId: event.id },
      })

      // Skip if no attendees
      if (attendeeCount === 0) {
        stats.skipped++
        continue
      }

      // Find host's next upcoming event (same organizer, future date, approved)
      const nextEvent = await prisma.eventSubmission.findFirst({
        where: {
          organizerInstagram: { equals: event.organizerInstagram, mode: 'insensitive' },
          status: 'APPROVED',
          eventDate: { gt: now },
          id: { not: event.id },
        },
        orderBy: { eventDate: 'asc' },
        select: {
          eventName: true,
          eventDate: true,
          slug: true,
          id: true,
        },
      })

      // Generate AI draft
      const { subject, body } = await generateDraftContent({
        eventName: event.eventName,
        category: event.category,
        hostName: event.organizerName,
        location: event.location,
        attendeeCount,
        nextEventName: nextEvent?.eventName || null,
        nextEventDate: nextEvent?.eventDate || null,
      })

      // Insert draft
      await prisma.postEventDraft.create({
        data: {
          eventId: event.id,
          hostInstagram: event.organizerInstagram,
          hostUserId: event.submittedByUserId,
          subject,
          body,
          eventName: event.eventName,
          eventDate: event.eventDate?.toISOString() || null,
          attendeeCount,
          category: event.category,
          status: 'DRAFT',
        },
      })

      stats.drafted++
    } catch (error) {
      console.error(`Failed to draft post-event email for event ${event.id}:`, error)
      stats.failed++
    }
  }

  return stats
}

// ============= AI DRAFT GENERATION =============

async function generateDraftContent(params: {
  eventName: string
  category: string
  hostName: string
  location: string
  attendeeCount: number
  nextEventName: string | null
  nextEventDate: Date | null
}): Promise<{ subject: string; body: string }> {
  const { eventName, category, hostName, location, attendeeCount, nextEventName, nextEventDate } =
    params

  const nextEventInfo =
    nextEventName && nextEventDate
      ? `${nextEventName} on ${nextEventDate.toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Singapore' })}`
      : null

  const prompt = `Write a short post-event thank-you email for attendees of ${eventName}, a ${category} event hosted by ${hostName} at ${location}. ${attendeeCount} people attended. Be warm, thank them for showing up, and mention the next upcoming event if provided: ${nextEventInfo || 'none'}. Keep it to 3-4 sentences. End with a CTA to RSVP for the next one if there is one. Do not include a subject line — only the body text. Do not include greetings like "Hi" or sign-offs like "Best regards" — just the core message.`

  try {
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const body = textBlock?.text?.trim() || ''

    if (!body) {
      throw new Error('Empty AI response')
    }

    return {
      subject: `Thanks for coming to ${eventName}! 🙌`,
      body,
    }
  } catch (error) {
    console.error('AI draft generation failed, using fallback:', error)
    // Static fallback
    const fallbackBody = nextEventInfo
      ? `Thank you so much for coming to ${eventName}! It was amazing to see ${attendeeCount} of you show up and bring the energy. We hope you had a great time and made some new connections. Our next session is ${nextEventInfo} — we'd love to see you there again!`
      : `Thank you so much for coming to ${eventName}! It was amazing to see ${attendeeCount} of you show up and bring the energy. We hope you had a great time and made some new connections. Stay tuned for our next session — we'd love to see you again!`

    return {
      subject: `Thanks for coming to ${eventName}! 🙌`,
      body: fallbackBody,
    }
  }
}

// ============= HOST: SEND DRAFT =============

/**
 * Sends the host-approved post-event draft to all attendees of the event.
 */
export async function sendPostEventDraft(
  draftId: string,
  hostSession: HostSession
): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  // Load draft and verify ownership
  const draft = await prisma.postEventDraft.findUnique({
    where: { id: draftId },
  })

  if (!draft) {
    return { success: false, error: 'Draft not found' }
  }

  if (draft.status === 'SENT') {
    return { success: false, error: 'Draft has already been sent' }
  }

  // Verify ownership
  const isOwner =
    draft.hostInstagram.toLowerCase() === hostSession.instagramHandle.toLowerCase() ||
    (draft.hostUserId && draft.hostUserId === hostSession.userId)

  if (!isOwner) {
    return { success: false, error: 'Unauthorized' }
  }

  // Load all attendees for this event
  const attendees = await prisma.eventAttendance.findMany({
    where: { eventId: draft.eventId },
    select: { email: true, name: true },
  })

  if (attendees.length === 0) {
    return { success: false, error: 'No attendees found for this event' }
  }

  // Find next event for CTA link
  const nextEvent = await prisma.eventSubmission.findFirst({
    where: {
      organizerInstagram: { equals: draft.hostInstagram, mode: 'insensitive' },
      status: 'APPROVED',
      eventDate: { gt: new Date() },
      id: { not: draft.eventId },
    },
    orderBy: { eventDate: 'asc' },
    select: { slug: true, id: true, eventName: true },
  })

  const nextEventUrl = nextEvent
    ? nextEvent.slug
      ? `${BASE_URL}/e/${nextEvent.slug}`
      : `${BASE_URL}/e/${nextEvent.id}`
    : null

  const hostName = hostSession.name || hostSession.instagramHandle

  // Build emails
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const emails: SendEmailOptions[] = attendees.map((attendee) => ({
    to: attendee.email,
    subject: draft.subject,
    replyTo: hostSession.email,
    html: buildThankYouEmailHtml({
      body: draft.body,
      hostName,
      hostInstagram: draft.hostInstagram,
      nextEventUrl,
      nextEventName: nextEvent?.eventName || null,
    }),
    tags: [
      { name: 'type', value: 'host_post_event' },
      { name: 'event_id', value: draft.eventId },
      { name: 'host', value: draft.hostInstagram },
    ],
  }))

  // Send batch
  const results = await sendBatchEmails(emails)
  const sentCount = results.filter((r) => r.success).length

  // Update draft status
  await prisma.postEventDraft.update({
    where: { id: draftId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      sentCount,
    },
  })

  return { success: true, sentCount }
}

function buildThankYouEmailHtml(params: {
  body: string
  hostName: string
  hostInstagram: string
  nextEventUrl: string | null
  nextEventName: string | null
}): string {
  const { body, hostName, hostInstagram, nextEventUrl, nextEventName } = params

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const nextEventCta = nextEventUrl
    ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0 0;">
        <tr>
          <td align="center" style="padding: 8px;">
            <a href="${nextEventUrl}" style="display: inline-block; padding: 14px 28px; background-color: #7c3aed; color: white; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
              RSVP for ${escapeHtml(nextEventName || 'Next Event')} →
            </a>
          </td>
        </tr>
      </table>
    `
    : ''

  return `
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
                ${escapeHtml(body).replace(/\n/g, '<br>')}
              </div>
              ${nextEventCta}
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #334155; font-size: 15px; font-weight: 600;">
                  ${escapeHtml(hostName)}
                </p>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">
                  @${escapeHtml(hostInstagram)} via SweatBuddies
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
}

// ============= HOST: GET PENDING DRAFTS =============

/**
 * Returns all pending (DRAFT status) post-event email drafts for the host.
 */
export async function getPendingDrafts(hostSession: HostSession) {
  const drafts = await prisma.postEventDraft.findMany({
    where: {
      hostInstagram: { equals: hostSession.instagramHandle, mode: 'insensitive' },
      status: 'DRAFT',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      eventId: true,
      eventName: true,
      eventDate: true,
      attendeeCount: true,
      category: true,
      subject: true,
      body: true,
      createdAt: true,
    },
  })

  return drafts
}
