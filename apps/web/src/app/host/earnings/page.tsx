/**
 * DISABLED - Marketplace earnings feature
 * Not used in P2P model (sessions are free or use direct P2P Stripe Connect)
 * Keep for reference in case paid marketplace is re-enabled later.
 * Disabled: 2026-03-12
 */

import Link from 'next/link'

export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h1 className="text-xl font-bold text-neutral-100 mb-2">Earnings Not Available</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Earnings tracking is not available in P2P mode.
        </p>
        <Link
          href="/host/dashboard"
          className="inline-block px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
