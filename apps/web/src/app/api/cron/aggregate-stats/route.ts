import { NextRequest, NextResponse } from 'next/server'
import {
  aggregateHostStats,
  aggregateActivityStats,
  createDailySnapshot,
  createMonthlySnapshot,
} from '@/lib/stats/aggregation'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max for cron jobs

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const cronSecret = request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')

  // Allow either cron secret or Vercel's built-in cron authentication
  const isVercelCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManualCron = !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET

  if (!isVercelCron && !isManualCron) {
    console.error('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const job = searchParams.get('job') || 'full'

  try {
    let result: unknown

    switch (job) {
      case 'host-stats':
        // Aggregate all host stats
        result = await aggregateHostStats()
        break

      case 'activity-stats':
        // Aggregate all activity stats
        result = await aggregateActivityStats()
        break

      case 'daily-snapshot':
        // Create daily snapshot for yesterday
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        result = await createDailySnapshot(yesterday)
        break

      case 'monthly-snapshot':
        // Create monthly snapshot for previous month
        const now = new Date()
        const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
        const prevYear =
          now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        result = await createMonthlySnapshot(prevYear, prevMonth)
        break

      case 'full':
        // Run full aggregation
        const hostResult = await aggregateHostStats()
        const activityResult = await aggregateActivityStats()
        const dailyResult = await createDailySnapshot()
        result = {
          hosts: hostResult,
          activities: activityResult,
          daily: dailyResult,
        }
        break

      default:
        return NextResponse.json(
          { error: `Invalid job type: ${job}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      job,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`❌ Cron job ${job} failed:`, error)
    return NextResponse.json(
      {
        success: false,
        job,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
