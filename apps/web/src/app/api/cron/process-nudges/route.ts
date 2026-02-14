import { NextRequest, NextResponse } from 'next/server'
import { isValidCronSecret } from '@/lib/cron-auth'
import { processNudges } from '@/lib/nudges'

export const maxDuration = 120

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    if (!CRON_SECRET || !isValidCronSecret(providedSecret, CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await processNudges()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Process nudges cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
