import { NextResponse } from 'next/server'
import { processIcebreakers } from '@/lib/icebreaker'
import { isValidCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Cron job to post AI-generated icebreaker questions
 * in event group chats 24 hours before the event.
 * Runs daily at 7:00 AM via Vercel cron.
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
    const stats = await processIcebreakers()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      stats,
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error('Icebreaker cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
