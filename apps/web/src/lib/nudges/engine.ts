// Nudge processing engine — runs signals 2, 3, 4 via daily cron

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { checkNudgeEligibility } from './dedup'
import { generateNudgeCopy } from './ai-copy'
import type { NudgeResult, ProcessNudgesResult } from './signals'

/**
 * Signal 2: Inactivity Re-engagement
 * Finds users who haven't joined anything in 14-90 days.
 * Joins users + event_attendances by email (case-insensitive).
 */
async function processInactivitySignal(): Promise<NudgeResult> {
  const result: NudgeResult = { sent: 0, skipped: 0, errors: 0 }

  try {
    const now = new Date()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Find users whose last attendance is between 14-90 days ago
    const inactiveUsers: Array<{
      id: string
      name: string | null
      email: string
      lastAttendance: Date
    }> = await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, MAX(ea.timestamp) as "lastAttendance"
      FROM users u
      INNER JOIN event_attendances ea ON LOWER(ea.email) = LOWER(u.email)
      WHERE ea.timestamp < ${fourteenDaysAgo}
        AND ea.timestamp > ${ninetyDaysAgo}
        AND u."deletedAt" IS NULL
      GROUP BY u.id, u.name, u.email
      HAVING MAX(ea.timestamp) < ${fourteenDaysAgo}
        AND MAX(ea.timestamp) > ${ninetyDaysAgo}
      LIMIT 50
    `

    for (const user of inactiveUsers) {
      try {
        const daysSince = Math.floor(
          (now.getTime() - new Date(user.lastAttendance).getTime()) / (1000 * 60 * 60 * 24)
        )

        const eligible = await checkNudgeEligibility(user.id, 'INACTIVITY_REENGAGEMENT')
        if (!eligible) {
          result.skipped++
          continue
        }

        const copy = await generateNudgeCopy({
          signalType: 'INACTIVITY_REENGAGEMENT',
          userName: user.name || undefined,
          daysSinceLastActivity: daysSince,
        })

        await createNotification({
          userId: user.id,
          type: 'NUDGE',
          title: copy.title,
          content: copy.body,
          link: '/discover',
          metadata: {
            nudgeType: 'INACTIVITY_REENGAGEMENT',
            daysSinceLastActivity: daysSince,
          },
        })
        result.sent++
      } catch (error) {
        console.error(`Inactivity nudge error for user ${user.id}:`, error)
        result.errors++
      }
    }
  } catch (error) {
    console.error('Inactivity signal processing error:', error)
    result.errors++
  }

  return result
}

/**
 * Signal 3: Low Fill Rate Alert
 * Finds APPROVED events 1-5 days out with < 50% fill rate compared to organizer's average.
 */
async function processLowFillRateSignal(): Promise<NudgeResult> {
  const result: NudgeResult = { sent: 0, skipped: 0, errors: 0 }

  try {
    const now = new Date()
    const oneDayOut = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    const fiveDaysOut = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    // Find upcoming approved events within 1-5 days
    const upcomingEvents = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        eventDate: {
          gte: oneDayOut,
          lte: fiveDaysOut,
        },
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        organizerInstagram: true,
        contactEmail: true,
        slug: true,
      },
    })

    for (const event of upcomingEvents) {
      try {
        // Count current attendees for this event
        const currentAttendees = await prisma.eventAttendance.count({
          where: { eventId: event.id },
        })

        // Get organizer's average past attendance
        const pastEvents = await prisma.eventSubmission.findMany({
          where: {
            organizerInstagram: event.organizerInstagram,
            status: 'APPROVED',
            eventDate: { lt: now },
            id: { not: event.id },
          },
          select: { id: true },
          take: 10,
          orderBy: { eventDate: 'desc' },
        })

        if (pastEvents.length === 0) continue // No history to compare

        const pastAttendanceCounts = await Promise.all(
          pastEvents.map((pe) =>
            prisma.eventAttendance.count({ where: { eventId: pe.id } })
          )
        )
        const avgAttendance =
          pastAttendanceCounts.reduce((sum, c) => sum + c, 0) / pastAttendanceCounts.length

        if (avgAttendance === 0) continue

        const fillPercent = Math.round((currentAttendees / avgAttendance) * 100)
        if (fillPercent >= 50) continue // Not low enough to alert

        const daysUntil = Math.ceil(
          ((event.eventDate?.getTime() || 0) - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Find the host's User record by email
        const hostUser = await prisma.user.findFirst({
          where: { email: { equals: event.contactEmail, mode: 'insensitive' } },
          select: { id: true },
        })

        if (!hostUser) continue

        const eligible = await checkNudgeEligibility(
          hostUser.id,
          'LOW_FILL_RATE',
          event.id
        )
        if (!eligible) {
          result.skipped++
          continue
        }

        const copy = await generateNudgeCopy({
          signalType: 'LOW_FILL_RATE',
          eventName: event.eventName,
          eventId: event.id,
          fillPercent,
          daysUntilEvent: daysUntil,
          currentAttendees,
        })

        const link = event.slug ? `/event/${event.slug}` : `/e/${event.id}`

        await createNotification({
          userId: hostUser.id,
          type: 'NUDGE',
          title: copy.title,
          content: copy.body,
          link,
          metadata: {
            nudgeType: 'LOW_FILL_RATE',
            entityId: event.id,
            fillPercent,
            daysUntilEvent: daysUntil,
            currentAttendees,
          },
        })
        result.sent++
      } catch (error) {
        console.error(`Low fill rate nudge error for event ${event.id}:`, error)
        result.errors++
      }
    }
  } catch (error) {
    console.error('Low fill rate signal processing error:', error)
    result.errors++
  }

  return result
}

/**
 * Signal 4: Regulars Not Signed Up
 * For events 3+ days out, finds attendees with 3+ past events by same organizer who haven't RSVP'd.
 */
async function processRegularsNotSignedUpSignal(): Promise<NudgeResult> {
  const result: NudgeResult = { sent: 0, skipped: 0, errors: 0 }

  try {
    const now = new Date()
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find upcoming approved events 3+ days out
    const upcomingEvents = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        eventDate: { gte: threeDaysOut },
      },
      select: {
        id: true,
        eventName: true,
        organizerInstagram: true,
        contactEmail: true,
        slug: true,
      },
    })

    for (const event of upcomingEvents) {
      try {
        // Get all past event IDs by the same organizer
        const pastEventIds = await prisma.eventSubmission.findMany({
          where: {
            organizerInstagram: event.organizerInstagram,
            status: 'APPROVED',
            eventDate: { lt: now },
          },
          select: { id: true },
        })

        if (pastEventIds.length < 3) continue // Not enough history

        // Find regulars: attendees with 3+ past events by this organizer
        const regulars: Array<{ email: string; name: string | null; count: bigint }> =
          await prisma.$queryRaw`
            SELECT ea.email, MAX(ea.name) as name, COUNT(DISTINCT ea."eventId") as count
            FROM event_attendances ea
            WHERE ea."eventId" = ANY(${pastEventIds.map((e) => e.id)})
            GROUP BY ea.email
            HAVING COUNT(DISTINCT ea."eventId") >= 3
          `

        // Get emails of people already RSVP'd for this event
        const alreadyRsvpd = await prisma.eventAttendance.findMany({
          where: { eventId: event.id },
          select: { email: true },
        })
        const rsvpdEmails = new Set(alreadyRsvpd.map((a) => a.email.toLowerCase()))

        // Filter to regulars who haven't RSVP'd
        const missingRegulars = regulars.filter(
          (r) => !rsvpdEmails.has(r.email.toLowerCase())
        )

        if (missingRegulars.length === 0) continue

        // Find the host's User record
        const hostUser = await prisma.user.findFirst({
          where: { email: { equals: event.contactEmail, mode: 'insensitive' } },
          select: { id: true },
        })

        if (!hostUser) continue

        const eligible = await checkNudgeEligibility(
          hostUser.id,
          'REGULARS_NOT_SIGNED_UP',
          event.id
        )
        if (!eligible) {
          result.skipped++
          continue
        }

        const regularNames = missingRegulars.map(
          (r) => r.name || r.email.split('@')[0]
        )

        const copy = await generateNudgeCopy({
          signalType: 'REGULARS_NOT_SIGNED_UP',
          eventName: event.eventName,
          eventId: event.id,
          regularNames,
          regularCount: missingRegulars.length,
        })

        const link = event.slug ? `/event/${event.slug}` : `/e/${event.id}`

        await createNotification({
          userId: hostUser.id,
          type: 'NUDGE',
          title: copy.title,
          content: copy.body,
          link,
          metadata: {
            nudgeType: 'REGULARS_NOT_SIGNED_UP',
            entityId: event.id,
            regularCount: missingRegulars.length,
            regularNames: regularNames.slice(0, 5),
          },
        })
        result.sent++
      } catch (error) {
        console.error(`Regulars nudge error for event ${event.id}:`, error)
        result.errors++
      }
    }
  } catch (error) {
    console.error('Regulars not signed up signal processing error:', error)
    result.errors++
  }

  return result
}

/**
 * Main entry point: process all cron-based nudge signals (2, 3, 4).
 */
export async function processNudges(): Promise<ProcessNudgesResult> {
  const inactivity = await processInactivitySignal()
  const lowFillRate = await processLowFillRateSignal()
  const regularsNotSignedUp = await processRegularsNotSignedUpSignal()

  return {
    inactivity,
    lowFillRate,
    regularsNotSignedUp,
    timestamp: new Date().toISOString(),
  }
}
