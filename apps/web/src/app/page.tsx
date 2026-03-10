import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Fitness Partners in Singapore',
  description: 'Stop working out alone. Find fitness buddies and join sessions near you.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full text-center">
        {/* Logo / wordmark */}
        <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase mb-6">
          SweatBuddies
        </p>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
          Stop Working Out<br />Alone
        </h1>

        <p className="text-lg text-neutral-400 mb-10 max-w-lg mx-auto leading-relaxed">
          Find fitness partners in Singapore. Join free sessions, host your own, and build your workout crew.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/buddy"
            className="bg-white text-neutral-900 px-8 py-4 rounded-xl font-semibold text-base hover:bg-neutral-100 transition-colors"
          >
            Browse Sessions
          </Link>
          <Link
            href="/sign-up"
            className="bg-neutral-800 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-neutral-700 transition-colors border border-neutral-700"
          >
            Sign Up Free
          </Link>
        </div>

        <p className="text-xs text-neutral-600 mt-10">
          🔨 Full landing page coming soon
        </p>
      </div>
    </div>
  )
}
