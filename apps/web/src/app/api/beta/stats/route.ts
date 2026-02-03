import { NextResponse } from 'next/server'
import { getBetaStats } from '@/lib/beta'

export async function GET() {
  try {
    const stats = await getBetaStats()

    return NextResponse.json({
      spotsRemaining: stats.spotsRemaining,
      totalSpots: stats.maxUsers,
      percentFilled: Math.round((stats.currentUsers / stats.maxUsers) * 100),
      showSpotsRemaining: stats.showSpotsRemaining,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
