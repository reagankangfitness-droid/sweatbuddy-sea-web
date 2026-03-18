'use client'

import { useRouter } from 'next/navigation'
import { Search, Award } from 'lucide-react'

export default function OnboardingRoleSelectionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      <div className="max-w-lg mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            What brings you here?
          </h1>
        </div>

        {/* Role cards */}
        <div className="space-y-4">
          {/* Looking for a coach */}
          <button
            onClick={() => router.push('/onboarding/p2p')}
            className="w-full text-left rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm hover:border-black/[0.12] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFFBF8] flex items-center justify-center">
                <Search className="w-6 h-6 text-[#4A4A5A]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  I want to discover experiences
                </h2>
                <p className="mt-1 text-sm text-[#9A9AAA]">
                  Fitness, wellness, and everything that gets you moving.
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-[#1A1A1A] group-hover:translate-x-1 transition-transform">
                  Let&apos;s go &rarr;
                </span>
              </div>
            </div>
          </button>

          {/* I am a coach */}
          <button
            onClick={() => router.push('/onboarding/p2p')}
            className="w-full text-left rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm hover:border-black/[0.12] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFFBF8] flex items-center justify-center">
                <Award className="w-6 h-6 text-[#4A4A5A]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  I organize experiences
                </h2>
                <p className="mt-1 text-sm text-[#9A9AAA]">
                  Create and manage fitness &amp; wellness experiences. Grow your community.
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-[#1A1A1A] group-hover:translate-x-1 transition-transform">
                  Let&apos;s go &rarr;
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
