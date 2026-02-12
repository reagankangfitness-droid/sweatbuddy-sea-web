import { NextRequest, NextResponse } from 'next/server'
import { processDueReminders } from '@/lib/reminders'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/process-reminders
 * Process all due reminders
 * Should be called by a cron job every 5 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    // Require the cron secret
    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process due reminders
    const result = await processDueReminders()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Error processing reminders:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/process-reminders
 * Also support GET for Vercel cron jobs
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
