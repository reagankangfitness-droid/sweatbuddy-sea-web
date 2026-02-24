import { NextResponse } from 'next/server'
import { draftPostEventEmails } from '@/lib/post-event-draft'
import { isValidCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron job to generate AI-drafted post-event thank-you emails
 * Runs at midnight SGT (16:00 UTC) via Vercel cron
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
    const stats = await draftPostEventEmails()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      stats,
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error('Draft post-event emails cron failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual testing
export async function POST(request: Request) {
  return GET(request)
}
