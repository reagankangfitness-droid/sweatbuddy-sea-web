import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCronSecret } from '@/lib/cron-auth'
import { createNotification } from '@/lib/notifications'
import { processWaitlistForSpot } from '@/lib/waitlist'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron job to process reconfirmation requests.
 * Runs every hour via Vercel cron.
 *
 * 1. Sends reconfirmation notifications to attendees of activities starting in 20-28 hours.
 * 2. Auto-cancels non-reconfirmed RSVPs for activities starting in < 6 hours.
 *
 * Security: Protected by CRON_SECRET environment variable.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const providedSecret = authHeader?.replace('Bearer ', '') || ''

  if (!cronSecret || !isValidCronSecret(providedSecret, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const now = new Date()

    // -------------------------------------------------------
    // STEP 1: Send reconfirmation notifications
    // Find activities starting between 20-28 hours from now
    // -------------------------------------------------------
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000)

    const activitiesNeedingReconfirmation = await prisma.activity.findMany({
      where: {
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
    })

    let reconfirmationsSent = 0

    for (const activity of activitiesNeedingReconfirmation) {
      // Find attendees who haven't been sent a reconfirmation yet
      const attendees = await prisma.userActivity.findMany({
        where: {
          activityId: activity.id,
          status: 'JOINED',
          reconfirmationSentAt: null,
        },
        select: {
          id: true,
          userId: true,
        },
      })

      for (const attendee of attendees) {
        // Create a reconfirmation notification
        await createNotification({
          userId: attendee.userId,
          type: 'ACTIVITY_UPDATE',
          title: 'Are you still coming?',
          content: `Please reconfirm your spot for "${activity.title}"`,
          link: `/activities/${activity.id}?reconfirm=true`,
          metadata: {
            activityId: activity.id,
            reconfirmation: true,
          },
        })

        // Mark reconfirmation as sent
        await prisma.userActivity.update({
          where: { id: attendee.id },
          data: { reconfirmationSentAt: now },
        })

        reconfirmationsSent++
      }
    }

    // -------------------------------------------------------
    // STEP 2: Auto-cancel non-reconfirmed RSVPs
    // Activities starting in < 6 hours where attendees were
    // sent a reconfirmation but did NOT reconfirm
    // -------------------------------------------------------
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000)

    const activitiesStartingSoon = await prisma.activity.findMany({
      where: {
        startTime: {
          gt: now,
          lte: sixHoursFromNow,
        },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
      },
    })

    let autoReleased = 0

    for (const activity of activitiesStartingSoon) {
      // Find attendees who were asked to reconfirm but did not
      const unconfirmedAttendees = await prisma.userActivity.findMany({
        where: {
          activityId: activity.id,
          status: 'JOINED',
          reconfirmationSentAt: { not: null },
          reconfirmedAt: null,
        },
        select: {
          id: true,
          userId: true,
          depositStatus: true,
        },
      })

      for (const attendee of unconfirmedAttendees) {
        const updateData: Record<string, unknown> = {
          status: 'CANCELLED' as const,
        }

        // Refund deposit if it was held (auto-cancelled, not a no-show)
        if (attendee.depositStatus === 'HELD') {
          updateData.depositStatus = 'REFUNDED'
          updateData.depositRefundedAt = new Date()
        }

        await prisma.userActivity.update({
          where: { id: attendee.id },
          data: updateData,
        })

        // Notify the user their RSVP was released
        await createNotification({
          userId: attendee.userId,
          type: 'ACTIVITY_UPDATE',
          title: 'Your spot has been released',
          content: `You did not reconfirm for "${activity.title}", so your spot was released.`,
          link: `/activities/${activity.id}`,
          metadata: {
            activityId: activity.id,
            autoReleased: true,
          },
        })

        autoReleased++
      }

      // If any spots were released, promote from waitlist
      if (unconfirmedAttendees.length > 0) {
        await processWaitlistForSpot(activity.id, unconfirmedAttendees.length)
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      stats: {
        reconfirmationsSent,
        autoReleased,
      },
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error('Reconfirmation cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
