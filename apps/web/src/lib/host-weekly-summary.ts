import { prisma } from '@/lib/prisma'
import { anthropic, AGENT_MODEL } from '@/lib/ai/client'
import { sendEmail } from '@/lib/email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/**
 * Get the Monday 00:00 and Sunday 23:59:59 of the *previous* week in SGT.
 * Called on Monday morning, so "this week" in the email means the week that just ended.
 */
function getPreviousWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date()
  // Shift to SGT (UTC+8)
  const sgOffset = 8 * 60
  const utcOffset = now.getTimezoneOffset()
  const sgNow = new Date(now.getTime() + (sgOffset + utcOffset) * 60 * 1000)

  // Monday of *current* week in SGT
  const day = sgNow.getDay()
  const daysToMonday = day === 0 ? 6 : day - 1
  const thisMonday = new Date(sgNow)
  thisMonday.setDate(sgNow.getDate() - daysToMonday)
  thisMonday.setHours(0, 0, 0, 0)

  // Previous Monday → previous Sunday
  const prevMonday = new Date(thisMonday)
  prevMonday.setDate(thisMonday.getDate() - 7)

  const prevSunday = new Date(prevMonday)
  prevSunday.setDate(prevMonday.getDate() + 6)
  prevSunday.setHours(23, 59, 59, 999)

  return { weekStart: prevMonday, weekEnd: prevSunday }
}

function getWeekBeforeBounds(weekStart: Date): { prevWeekStart: Date; prevWeekEnd: Date } {
  const prevWeekEnd = new Date(weekStart.getTime() - 1)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)
  prevWeekStart.setHours(0, 0, 0, 0)
  return { prevWeekStart, prevWeekEnd }
}

interface HostData {
  organizer: {
    id: string
    email: string
    name: string | null
    instagramHandle: string
    communityName: string | null
    lastWeeklySummarySentAt: Date | null
  }
  eventsThisWeek: number
  rsvpsThisWeek: number
  rsvpsLastWeek: number
  newMembersThisWeek: number
  revenueThisWeek: number
  topEvent: { name: string; rsvps: number } | null
}

async function gatherHostData(
  organizerInstagram: string,
  weekStart: Date,
  weekEnd: Date
): Promise<HostData | null> {
  const organizer = await prisma.organizer.findUnique({
    where: { instagramHandle: organizerInstagram },
    select: {
      id: true,
      email: true,
      name: true,
      instagramHandle: true,
      communityName: true,
      lastWeeklySummarySentAt: true,
    },
  })
  if (!organizer) return null

  // Events this host had in the target week
  const events = await prisma.eventSubmission.findMany({
    where: {
      organizerInstagram: { equals: organizerInstagram, mode: 'insensitive' },
      status: 'APPROVED',
      eventDate: { gte: weekStart, lte: weekEnd },
    },
    select: { id: true, eventName: true, price: true, isFree: true },
  })

  const eventIds = events.map((e) => e.id)

  // RSVPs this week
  const rsvpsThisWeek = eventIds.length > 0
    ? await prisma.eventAttendance.count({
        where: { eventId: { in: eventIds } },
      })
    : 0

  // RSVPs the week before (for comparison)
  const { prevWeekStart, prevWeekEnd } = getWeekBeforeBounds(weekStart)
  const prevEvents = await prisma.eventSubmission.findMany({
    where: {
      organizerInstagram: { equals: organizerInstagram, mode: 'insensitive' },
      status: 'APPROVED',
      eventDate: { gte: prevWeekStart, lte: prevWeekEnd },
    },
    select: { id: true },
  })
  const prevEventIds = prevEvents.map((e) => e.id)
  const rsvpsLastWeek = prevEventIds.length > 0
    ? await prisma.eventAttendance.count({
        where: { eventId: { in: prevEventIds } },
      })
    : 0

  // New community members this week (first-time attendees across all of this organizer's events)
  const allOrgEvents = await prisma.eventSubmission.findMany({
    where: {
      organizerInstagram: { equals: organizerInstagram, mode: 'insensitive' },
      status: 'APPROVED',
    },
    select: { id: true },
  })
  const allOrgEventIds = allOrgEvents.map((e) => e.id)

  // Attendees who RSVP'd this week and never RSVP'd before this week
  let newMembersThisWeek = 0
  if (eventIds.length > 0) {
    const thisWeekAttendeeEmails = await prisma.eventAttendance.findMany({
      where: { eventId: { in: eventIds } },
      select: { email: true },
      distinct: ['email'],
    })
    const emails = thisWeekAttendeeEmails.map((a) => a.email)

    if (emails.length > 0) {
      const returningCount = await prisma.eventAttendance.count({
        where: {
          eventId: { in: allOrgEventIds, notIn: eventIds },
          email: { in: emails },
        },
      })
      // Rough: unique emails this week minus those who had prior attendance
      // More precise: count distinct emails that had zero prior
      const returningEmails = await prisma.eventAttendance.findMany({
        where: {
          eventId: { in: allOrgEventIds, notIn: eventIds },
          email: { in: emails },
        },
        select: { email: true },
        distinct: ['email'],
      })
      newMembersThisWeek = emails.length - returningEmails.length
    }
  }

  // Revenue this week
  let revenueThisWeek = 0
  if (eventIds.length > 0) {
    const paidAttendance = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentAmount: { not: null },
      },
      select: { paymentAmount: true },
    })
    revenueThisWeek = paidAttendance.reduce(
      (sum, a) => sum + (a.paymentAmount || 0),
      0
    )
  }

  // Top event by RSVPs
  let topEvent: { name: string; rsvps: number } | null = null
  if (eventIds.length > 0) {
    const eventRsvpCounts = await Promise.all(
      events.map(async (e) => ({
        name: e.eventName,
        rsvps: await prisma.eventAttendance.count({
          where: { eventId: e.id },
        }),
      }))
    )
    eventRsvpCounts.sort((a, b) => b.rsvps - a.rsvps)
    if (eventRsvpCounts.length > 0 && eventRsvpCounts[0].rsvps > 0) {
      topEvent = eventRsvpCounts[0]
    }
  }

  return {
    organizer,
    eventsThisWeek: events.length,
    rsvpsThisWeek,
    rsvpsLastWeek,
    newMembersThisWeek,
    revenueThisWeek,
    topEvent,
  }
}

async function generateSummary(data: HostData): Promise<string> {
  const hostName = data.organizer.name || data.organizer.instagramHandle
  const communityName = data.organizer.communityName || `@${data.organizer.instagramHandle}'s community`
  const revenueStr =
    data.revenueThisWeek > 0
      ? `$${(data.revenueThisWeek / 100).toFixed(2)}`
      : 'free events'
  const topEventStr = data.topEvent
    ? `${data.topEvent.name} (${data.topEvent.rsvps} RSVPs)`
    : 'N/A'

  const prompt = `You're a growth advisor for a fitness community host. Write a 4-5 line weekly summary based on their data. Be specific — use their numbers. Include 1 insight and 1 suggestion. Warm but direct. No fluff.

Host: ${hostName}
Community: ${communityName}
Events this week: ${data.eventsThisWeek}
RSVPs this week: ${data.rsvpsThisWeek}
New members: ${data.newMembersThisWeek}
Revenue: ${revenueStr}
Last week RSVPs: ${data.rsvpsLastWeek}
Top event: ${topEventStr}`

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((c) => c.type === 'text')
  if (!text || text.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  return text.text.trim()
}

function buildSummaryEmailHtml(
  hostName: string,
  communityName: string,
  summary: string,
  data: HostData
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your week at ${communityName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">
                Your week at ${communityName}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">
                Weekly summary for ${hostName}
              </p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding: 24px 32px 0; background-color: white;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 12px; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e40af;">${data.eventsThisWeek}</div>
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Events</div>
                  </td>
                  <td align="center" style="padding: 12px; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e40af;">${data.rsvpsThisWeek}</div>
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">RSVPs</div>
                  </td>
                  <td align="center" style="padding: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e40af;">${data.newMembersThisWeek}</div>
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">New</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- AI Summary -->
          <tr>
            <td style="padding: 24px 32px 32px; background-color: white;">
              <div style="white-space: pre-wrap; line-height: 1.7; color: #334155; font-size: 15px;">
                ${summary.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; background-color: white;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}/host" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                Sent every Monday at 8am SGT to active SweatBuddies hosts.
              </p>
              <a href="${BASE_URL}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">
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
}

export async function processHostWeeklySummaries(): Promise<{
  total: number
  sent: number
  skipped: number
  errors: number
}> {
  const { weekStart, weekEnd } = getPreviousWeekBounds()

  // Find organizers who had at least 1 approved event in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const activeHandles = await prisma.eventSubmission.findMany({
    where: {
      status: 'APPROVED',
      eventDate: { gte: thirtyDaysAgo },
    },
    select: { organizerInstagram: true },
    distinct: ['organizerInstagram'],
  })

  const results = { total: activeHandles.length, sent: 0, skipped: 0, errors: 0 }

  for (const { organizerInstagram } of activeHandles) {
    try {
      const data = await gatherHostData(organizerInstagram, weekStart, weekEnd)
      if (!data) {
        results.skipped++
        continue
      }

      // Idempotency guard: skip if we already sent a summary for this week.
      // weekStart is the Monday 00:00 of the week being reported.
      // If lastWeeklySummarySentAt >= weekStart, we already sent this week's email.
      if (
        data.organizer.lastWeeklySummarySentAt &&
        data.organizer.lastWeeklySummarySentAt >= weekStart
      ) {
        console.info(
          `[host-weekly-summary] Already sent for ${organizerInstagram} week of ${weekStart.toISOString()} — skipping`
        )
        results.skipped++
        continue
      }

      // Skip if zero activity this week — nothing interesting to report
      if (data.eventsThisWeek === 0 && data.rsvpsThisWeek === 0) {
        results.skipped++
        continue
      }

      const summary = await generateSummary(data)
      const hostName = data.organizer.name || data.organizer.instagramHandle
      const communityName =
        data.organizer.communityName || `@${data.organizer.instagramHandle}`

      const html = buildSummaryEmailHtml(hostName, communityName, summary, data)
      const subject = `Your week at ${communityName} — ${data.rsvpsThisWeek} RSVPs`

      const result = await sendEmail({
        to: data.organizer.email,
        subject,
        html,
        tags: [
          { name: 'type', value: 'host_weekly_summary' },
          { name: 'organizer_id', value: data.organizer.id },
        ],
      })

      if (result.success) {
        // Mark this week as sent so retries won't re-send
        await prisma.organizer.update({
          where: { id: data.organizer.id },
          data: { lastWeeklySummarySentAt: new Date() },
        })
        results.sent++
      } else {
        results.errors++
        console.error(
          `[host-weekly-summary] Email failed for ${organizerInstagram}:`,
          result.error
        )
      }
    } catch (error) {
      results.errors++
      console.error(
        `[host-weekly-summary] Error processing ${organizerInstagram}:`,
        error
      )
    }
  }

  return results
}
