import { NextRequest, NextResponse } from 'next/server'
import { processDueReviewPrompts, processReviewReminders } from '@/lib/reviews'

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/review-prompts
 * Cron job to process review prompts and reminders
 *
 * This endpoint should be called by a cron service (e.g., Vercel Cron, Railway Cron)
 * every hour to:
 * 1. Schedule new review prompts for completed activities
 * 2. Process pending review prompts (send emails)
 * 3. Send reminder emails for unanswered prompts
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: {
      prompts: { processed: number; sent: number; failed: number }
      reminders: { processed: number; sent: number; failed: number }
    } = {
      prompts: { processed: 0, sent: 0, failed: 0 },
      reminders: { processed: 0, sent: 0, failed: 0 },
    }

    // Process pending review prompts (send initial emails)
    try {
      const promptResults = await processDueReviewPrompts()
      results.prompts = { ...promptResults }
    } catch (error) {
      console.error('Error processing review prompts:', error)
      results.prompts.failed = 1
    }

    // Process review reminders (send reminder emails)
    try {
      const reminderResults = await processReviewReminders()
      results.reminders = { ...reminderResults, failed: 0 }
    } catch (error) {
      console.error('Error processing review reminders:', error)
      results.reminders.failed = 1
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in review prompts cron:', error)
    return NextResponse.json(
      { error: 'Failed to process review prompts' },
      { status: 500 }
    )
  }
}

// Also support GET for simpler cron setups
export async function GET(request: NextRequest) {
  return POST(request)
}
