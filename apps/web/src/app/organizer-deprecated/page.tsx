import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'We\'ve Rebuilt SweatBuddies',
  robots: { index: false },
}

export default function OrganizerDeprecated() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-5">🔄</div>

        <h1 className="text-2xl font-bold text-white mb-3">
          We&apos;ve Rebuilt SweatBuddies
        </h1>

        <p className="text-neutral-400 mb-6 leading-relaxed text-sm">
          The organizer portal has been replaced with our new P2P platform.
          Host sessions, find workout partners, and grow your fitness community
          — all in one place.
        </p>

        <div className="space-y-3">
          <Link
            href="/sign-up"
            className="block w-full bg-white text-neutral-900 py-3 px-6 rounded-xl font-semibold hover:bg-neutral-100 transition-colors"
          >
            Join the New Platform
          </Link>

          <Link
            href="/buddy"
            className="block w-full bg-neutral-800 text-white py-3 px-6 rounded-xl font-semibold hover:bg-neutral-700 transition-colors"
          >
            Browse Sessions
          </Link>
        </div>

        <p className="text-xs text-neutral-500 mt-6">
          Questions?{' '}
          <a
            href="mailto:support@sweatbuddies.sg"
            className="text-neutral-300 underline hover:text-white"
          >
            support@sweatbuddies.sg
          </a>
        </p>
      </div>
    </div>
  )
}
