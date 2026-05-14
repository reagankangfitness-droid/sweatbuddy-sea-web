import { NextResponse } from 'next/server'
import { isValidCronSecret } from '@/lib/cron-auth'
import { expireStalePendingReservations } from '@/lib/pending-reservations'

export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const providedSecret = authHeader?.replace('Bearer ', '') || ''

    if (!cronSecret || !isValidCronSecret(providedSecret, cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await expireStalePendingReservations()

    return NextResponse.json({
      success: true,
      ...result,
      cutoff: result.cutoff.toISOString(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Expire pending reservations cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
