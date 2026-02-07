'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { OnboardingTour } from '@/components/OnboardingTour'

const steps = [
  { emoji: '🙋', title: 'Post a wave', description: 'Say what you want to do and when' },
  { emoji: '👋', title: 'Others join', description: 'Nearby people hop on your wave' },
  { emoji: '💬', title: 'Meet up', description: 'Chat, coordinate, and go do it' },
]

const activities = [
  '🏃', '🧘', '🏋️', '🚴', '🏊', '🥾', '🎾', '🏀',
  '⚽', '🏐', '🏓', '🧗', '🏄', '🛹', '💃', '🥊',
  '🏸', '⛳',
]

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/app')
    }
  }, [isLoaded, isSignedIn, router])

  // Show nothing while checking auth to avoid flash
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Onboarding Tour for first-time visitors */}
      <OnboardingTour />

      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero-1.webp)' }}
      >
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-2xl mx-auto gap-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Show up alone.<br />Leave with a crew.
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-md">
            Find people near you who want to work out right now. Post a wave, meet up, and sweat together.
          </p>
          <a
            href="/sign-up"
            className="relative z-20 inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            Find Your Crew
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center gap-3">
              <span className="text-5xl">{step.emoji}</span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-white/60 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section className="px-6 py-12 max-w-3xl mx-auto text-center">
        <p className="text-white/40 text-sm mb-4">Works for any activity</p>
        <div className="flex flex-wrap justify-center gap-3 text-3xl">
          {activities.map((emoji, i) => (
            <span key={i}>{emoji}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-white/30 text-sm border-t border-white/10">
        <p className="font-semibold text-white/50 mb-1">SweatBuddy</p>
        <p>Made in Singapore</p>
      </footer>
    </main>
  )
}
