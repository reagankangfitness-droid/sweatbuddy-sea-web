import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  processDueReviewPrompts,
  processReviewReminders,
  scheduleReviewPrompt,
} from '@/lib/reviews'
import { processPostEventFollowUps } from '@/lib/post-event-followup'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/daily-jobs
 * Consolidated daily cron job that runs all scheduled tasks
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: Record<string, unknown> = {}

    // 1. Schedule review prompts for recently ended activities
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const recentActivities = await prisma.activity.findMany({
        where: {
          endTime: { gte: oneDayAgo, lte: now },
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          userActivities: {
            where: { status: { in: ['JOINED', 'COMPLETED'] } },
            select: { id: true, userId: true, review: true },
          },
        },
      })

      const toProcess = recentActivities.flatMap((a) =>
        a.userActivities
          .filter((ua) => !ua.review)
          .map((ua) => ({ ...ua, activityId: a.id, endTime: a.endTime! }))
      )

      const existingPrompts = await prisma.reviewPrompt.findMany({
        where: { userActivityId: { in: toProcess.map((p) => p.id) } },
        select: { userActivityId: true },
      })
      const existingIds = new Set(existingPrompts.map((p) => p.userActivityId))

      let scheduled = 0
      for (const ua of toProcess.filter((p) => !existingIds.has(p.id))) {
        try {
          await scheduleReviewPrompt(ua.id, ua.activityId, ua.userId, ua.endTime)
          scheduled++
        } catch {
          // Individual scheduling failures shouldn't stop the batch
        }
      }
      results.schedulePrompts = { scheduled }
    } catch (e) {
      results.schedulePrompts = { error: String(e) }
    }

    // 2. Process due review prompts
    try {
      results.reviewPrompts = await processDueReviewPrompts()
    } catch (e) {
      results.reviewPrompts = { error: String(e) }
    }

    // 3. Process review reminders
    try {
      results.reviewReminders = await processReviewReminders()
    } catch (e) {
      results.reviewReminders = { error: String(e) }
    }

    // 4. Process waitlist notifications
    try {
      const waitlistResult = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'}/api/cron/process-waitlist`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        }
      )
      results.waitlist = await waitlistResult.json()
    } catch (e) {
      results.waitlist = { error: String(e) }
    }

    // 5. Process activity reminders
    try {
      const remindersResult = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'}/api/cron/process-reminders`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        }
      )
      results.reminders = await remindersResult.json()
    } catch (e) {
      results.reminders = { error: String(e) }
    }

    // 6. Aggregate stats
    try {
      const statsResult = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'}/api/cron/aggregate-stats?job=full`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        }
      )
      results.stats = await statsResult.json()
    } catch (e) {
      results.stats = { error: String(e) }
    }

    // 7. Process post-event follow-up emails
    try {
      results.postEventFollowUps = await processPostEventFollowUps()
    } catch (e) {
      results.postEventFollowUps = { error: String(e) }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily jobs error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
