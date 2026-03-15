import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  processDueReviewPrompts,
  processReviewReminders,
  scheduleReviewPrompt,
} from '@/lib/reviews'
import { processPostEventFollowUps } from '@/lib/post-event-followup'
import { isValidCronSecret } from '@/lib/cron-auth'

// This route makes multiple sub-requests and DB queries — needs longer timeout
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/daily-jobs
 * Consolidated daily cron job that runs all scheduled tasks
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    if (!CRON_SECRET || !isValidCronSecret(providedSecret, CRON_SECRET)) {
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

    // 4-7. Run remaining jobs in parallel with per-request timeouts
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'

    const fetchWithTimeout = async (url: string): Promise<unknown> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15_000)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
          signal: controller.signal,
        })
        return await res.json()
      } finally {
        clearTimeout(timeoutId)
      }
    }

    const parallelJobs = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/cron/process-waitlist`),
      fetchWithTimeout(`${baseUrl}/api/cron/process-reminders`),
      fetchWithTimeout(`${baseUrl}/api/cron/aggregate-stats?job=full`),
      processPostEventFollowUps(),
    ])

    const jobKeys = ['waitlist', 'reminders', 'stats', 'postEventFollowUps'] as const
    parallelJobs.forEach((result, i) => {
      results[jobKeys[i]] =
        result.status === 'fulfilled'
          ? result.value
          : { error: String(result.reason) }
    })

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
