import { NextResponse } from 'next/server'
import { processEventReminders } from '@/lib/event-reminders'
import { isValidCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

/**
 * Cron job to process event reminders
 * Runs every 15 minutes via Vercel cron
 *
 * Security: Protected by CRON_SECRET environment variable
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
    const stats = await processEventReminders()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      stats,
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
