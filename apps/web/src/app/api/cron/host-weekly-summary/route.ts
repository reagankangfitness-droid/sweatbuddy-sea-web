import { NextRequest, NextResponse } from 'next/server'
import { isValidCronSecret } from '@/lib/cron-auth'
import { processHostWeeklySummaries } from '@/lib/host-weekly-summary'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — one Claude call per host

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/host-weekly-summary
 * Sends each active host a weekly summary email with AI-generated insights.
 * Triggered every Monday at 8am SGT via Vercel Cron.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    if (!CRON_SECRET || !isValidCronSecret(providedSecret, CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await processHostWeeklySummaries()

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Host weekly summary cron error:', error)
    return NextResponse.json(
      { error: 'Failed to run host weekly summary' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
