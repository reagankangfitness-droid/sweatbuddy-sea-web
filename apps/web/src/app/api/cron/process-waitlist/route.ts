import { NextResponse } from 'next/server'
import { processExpiredNotifications } from '@/lib/waitlist'

export async function GET(request: Request) {
  try {
    // Verify cron secret from Vercel or other services
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Only verify if CRON_SECRET is set (skip in development)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process expired notifications
    const result = await processExpiredNotifications()

    return NextResponse.json({
      success: true,
      expiredProcessed: result.processed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

// Also support POST for Vercel Cron
export async function POST(request: Request) {
  return GET(request)
}
