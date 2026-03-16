'use client'

import { useRouter } from 'next/navigation'
import { Search, Award } from 'lucide-react'

export default function OnboardingRoleSelectionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-lg mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Welcome to SweatBuddies
          </h1>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-sm">
            What brings you here?
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-4">
          {/* Looking for a coach */}
          <button
            onClick={() => router.push('/onboarding/p2p')}
            className="w-full text-left rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Search className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  I&apos;m looking for a coach
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Find verified coaches for fitness, sports, and wellness
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                  Find a coach &rarr;
                </span>
              </div>
            </div>
          </button>

          {/* I am a coach */}
          <button
            onClick={() => router.push('/onboarding/coach')}
            className="w-full text-left rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Award className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  I am a coach
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Get discovered by students and grow your coaching business
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                  Apply as a coach &rarr;
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
