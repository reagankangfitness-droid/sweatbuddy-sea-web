/**
 * DISABLED - Marketplace host earnings API
 * Not used in P2P model. Sessions are free (P2P_FREE) or use direct Stripe Connect (P2P_PAID).
 * Keep for reference in case paid marketplace is re-enabled.
 * Disabled: 2026-03-12
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Earnings feature not available in P2P mode' },
    { status: 410 }
  )
}
