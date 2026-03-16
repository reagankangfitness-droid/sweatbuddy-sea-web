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
            Ready to find your people?
          </h1>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-sm">
            How do you want to start?
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
                  I want to join a community
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Find people who move like you — run clubs, yoga circles, swimming crews, and more.
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                  Let&apos;s go &rarr;
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
                  I lead a community
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Already running a fitness group? Give your crew a home and grow it.
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                  Set up your community &rarr;
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
