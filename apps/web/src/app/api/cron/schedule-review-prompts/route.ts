import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scheduleReviewPrompt } from '@/lib/reviews'

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/schedule-review-prompts
 * Cron job to schedule review prompts for recently completed activities
 *
 * This endpoint should be called every 30 minutes to:
 * 1. Find activities that ended in the last hour
 * 2. Create review prompts for all attendees who haven't reviewed yet
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Find activities that ended between 2 hours and 1 hour ago
    // This gives a window for processing without missing any
    const recentlyEndedActivities = await prisma.activity.findMany({
      where: {
        endTime: {
          gte: twoHoursAgo,
          lte: oneHourAgo,
        },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        userActivities: {
          where: {
            status: { in: ['JOINED', 'COMPLETED'] },
          },
          select: {
            id: true,
            userId: true,
            user: {
              select: { id: true, email: true },
            },
            review: true,
          },
        },
      },
    })

    // Collect all userActivity IDs that need processing
    const userActivitiesToProcess: Array<{
      id: string
      userId: string
      activityId: string
      endTime: Date
    }> = []

    for (const activity of recentlyEndedActivities) {
      for (const userActivity of activity.userActivities) {
        // Skip if already reviewed
        if (userActivity.review) continue
        userActivitiesToProcess.push({
          id: userActivity.id,
          userId: userActivity.userId,
          activityId: activity.id,
          endTime: activity.endTime!,
        })
      }
    }

    if (userActivitiesToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        results: {
          activitiesProcessed: recentlyEndedActivities.length,
          promptsScheduled: 0,
          skipped: 0,
          errors: 0,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Batch check for existing prompts (avoid N+1)
    const existingPrompts = await prisma.reviewPrompt.findMany({
      where: {
        userActivityId: { in: userActivitiesToProcess.map((ua) => ua.id) },
      },
      select: { userActivityId: true },
    })
    const existingPromptIds = new Set(existingPrompts.map((p) => p.userActivityId))

    // Filter to only those without prompts
    const toSchedule = userActivitiesToProcess.filter(
      (ua) => !existingPromptIds.has(ua.id)
    )
    const skippedCount = userActivitiesToProcess.length - toSchedule.length

    let scheduledCount = 0
    const errors: string[] = []

    for (const ua of toSchedule) {
      try {
        await scheduleReviewPrompt(ua.id, ua.activityId, ua.userId, ua.endTime)
        scheduledCount++
      } catch (error) {
        errors.push(`Failed to schedule prompt for userActivity ${ua.id}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        activitiesProcessed: recentlyEndedActivities.length,
        promptsScheduled: scheduledCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error scheduling review prompts:', error)
    return NextResponse.json(
      { error: 'Failed to schedule review prompts' },
      { status: 500 }
    )
  }
}

// Also support GET for simpler cron setups
export async function GET(request: NextRequest) {
  return POST(request)
}
