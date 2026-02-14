// Signal 1: Event Recommendation — fires inline on event approval

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { checkNudgeEligibility } from './dedup'
import { generateNudgeCopy } from './ai-copy'

/**
 * Send recommendation nudges to past attendees of the same organizer
 * when a new event is approved.
 */
export async function sendEventRecommendationNudges(eventId: string): Promise<void> {
  const event = await prisma.eventSubmission.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventName: true,
      organizerInstagram: true,
      organizerName: true,
      slug: true,
    },
  })

  if (!event) return

  // Find all past events by the same organizer
  const pastEvents = await prisma.eventSubmission.findMany({
    where: {
      organizerInstagram: event.organizerInstagram,
      status: 'APPROVED',
      id: { not: event.id },
    },
    select: { id: true },
  })

  if (pastEvents.length === 0) return

  // Get unique emails of past attendees
  const pastAttendees = await prisma.eventAttendance.findMany({
    where: {
      eventId: { in: pastEvents.map((e) => e.id) },
    },
    select: { email: true },
    distinct: ['email'],
  })

  // Get emails already RSVP'd for this new event
  const alreadyRsvpd = await prisma.eventAttendance.findMany({
    where: { eventId: event.id },
    select: { email: true },
  })
  const rsvpdEmails = new Set(alreadyRsvpd.map((a) => a.email.toLowerCase()))

  // Filter out people who already RSVP'd
  const eligibleEmails = pastAttendees
    .map((a) => a.email)
    .filter((email) => !rsvpdEmails.has(email.toLowerCase()))

  if (eligibleEmails.length === 0) return

  // Match emails to User records for userId
  const users = await prisma.user.findMany({
    where: {
      email: { in: eligibleEmails, mode: 'insensitive' },
      deletedAt: null,
    },
    select: { id: true, email: true, name: true },
  })

  const link = event.slug ? `/event/${event.slug}` : `/e/${event.id}`

  for (const user of users) {
    try {
      const eligible = await checkNudgeEligibility(
        user.id,
        'EVENT_RECOMMENDATION',
        event.id
      )
      if (!eligible) continue

      const copy = await generateNudgeCopy({
        signalType: 'EVENT_RECOMMENDATION',
        eventName: event.eventName,
        eventId: event.id,
        organizerName: event.organizerName,
      })

      await createNotification({
        userId: user.id,
        type: 'NUDGE',
        title: copy.title,
        content: copy.body,
        link,
        metadata: {
          nudgeType: 'EVENT_RECOMMENDATION',
          entityId: event.id,
          eventName: event.eventName,
          organizerName: event.organizerName,
        },
      })
    } catch (error) {
      console.error(`Event recommendation nudge error for user ${user.id}:`, error)
    }
  }
}
