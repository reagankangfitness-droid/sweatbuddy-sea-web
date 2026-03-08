import { prisma } from '@/lib/prisma'
import { sendBatchEmails } from '@/lib/email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

/**
 * Notify community followers when a new event is approved.
 * Rate-limited: max 1 notification per community per 24 hours.
 * Fire-and-forget — caller should wrap in try/catch.
 */
export async function notifyFollowersOfNewEvent(submission: {
  id: string
  eventName: string
  organizerName: string
  organizerInstagram: string
  eventDate: Date | null
  time: string
  location: string
  slug: string | null
}) {
  const normalized = submission.organizerInstagram.replace(/^@/, '').toLowerCase().trim()
  if (!normalized) return

  // Find the community by instagram handle
  const community = await prisma.community.findFirst({
    where: { instagramHandle: { equals: normalized, mode: 'insensitive' } },
    select: { id: true, name: true },
  })

  if (!community) return

  // Rate limit: check if we already notified for this community in the last 24 hours
  // We use a simple heuristic: check if another event was approved for this organizer
  // in the last 24 hours (besides the current one)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentApprovals = await prisma.eventSubmission.count({
    where: {
      organizerInstagram: { in: [normalized, `@${normalized}`], mode: 'insensitive' },
      status: 'APPROVED',
      reviewedAt: { gte: oneDayAgo },
      id: { not: submission.id },
    },
  })

  if (recentApprovals > 0) {
    console.log(`Skipping follower notification for ${community.name}: another event was approved in the last 24h`)
    return
  }

  // Get all community members (excluding the owner/host)
  const members = await prisma.communityMember.findMany({
    where: {
      communityId: community.id,
      role: { not: 'OWNER' },
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  })

  if (members.length === 0) return

  const eventUrl = `${BASE_URL}/e/${submission.slug || submission.id}`
  const dateStr = submission.eventDate
    ? new Date(submission.eventDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : submission.time || 'Date TBD'
  const timeStr = submission.time || ''

  // Build emails
  const emails = members
    .filter((m) => m.user.email)
    .map((m) => ({
      to: m.user.email,
      subject: `${submission.organizerName} just posted: ${submission.eventName}`,
      html: buildNewEventEmail({
        recipientName: m.user.name || 'there',
        communityName: community.name,
        eventName: submission.eventName,
        organizerName: submission.organizerName,
        dateStr,
        timeStr,
        location: submission.location,
        eventUrl,
        unfollowUrl: `${BASE_URL}/communities`,
      }),
      tags: [
        { name: 'type', value: 'new-event-notification' },
        { name: 'community', value: community.id },
      ],
    }))

  const results = await sendBatchEmails(emails)
  const sent = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  console.log(`New event notification for "${community.name}": ${sent} sent, ${failed} failed`)
}

function buildNewEventEmail(params: {
  recipientName: string
  communityName: string
  eventName: string
  organizerName: string
  dateStr: string
  timeStr: string
  location: string
  eventUrl: string
  unfollowUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🎉</div>
      <h1 style="color:#ffffff;font-size:20px;margin:0;">New Event from ${escapeHtml(params.communityName)}</h1>
    </div>

    <!-- Content -->
    <div style="padding:24px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hey ${escapeHtml(params.recipientName)},
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong>${escapeHtml(params.organizerName)}</strong> just posted a new event:
      </p>

      <!-- Event Card -->
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">${escapeHtml(params.eventName)}</h2>
        <div style="color:#6b7280;font-size:14px;line-height:1.8;">
          <div>📅 ${escapeHtml(params.dateStr)}${params.timeStr ? ` · ${escapeHtml(params.timeStr)}` : ''}</div>
          <div>📍 ${escapeHtml(params.location)}</div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${params.eventUrl}" style="display:inline-block;padding:14px 32px;background:#111827;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;font-size:16px;">
          RSVP Now
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        You're receiving this because you follow ${escapeHtml(params.communityName)}.
        <a href="${params.unfollowUrl}" style="color:#6b7280;">Manage your communities</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">SweatBuddies — Find your tribe, get moving.</p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
