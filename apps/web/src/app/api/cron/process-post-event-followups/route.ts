import { NextResponse } from 'next/server'
import { processPostEventFollowUps } from '@/lib/post-event-followup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

/**
 * Cron job to process post-event follow-up emails
 * Runs every 30 minutes via Vercel cron
 *
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Require the cron secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const stats = await processPostEventFollowUps()

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
