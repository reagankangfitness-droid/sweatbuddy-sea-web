'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HowItWorks } from '@/components/HowItWorks'
import { OnboardingTour } from '@/components/OnboardingTour'
import { Footer } from '@/components/Footer'

const hostValues = [
  {
    title: 'Free to host',
    description: 'No monthly fees. We earn when you do.',
  },
  {
    title: 'Made for SEA',
    description: 'Google Maps, PayNow, local community.',
  },
  {
    title: 'AI that helps',
    description: 'Content generator, growth insights, chat assistant.',
  },
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
      {/* Onboarding tour for first-time attendee visitors */}
      <OnboardingTour />

      {/* 1. HERO — Attendee-first, full viewport */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero-1.webp)' }}
      >
        <div className="absolute inset-0 bg-black/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-start px-6 lg:px-10 py-20 max-w-3xl mx-auto w-full gap-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Show up alone.<br />Leave with a crew.
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-lg">
            Hundreds of group workouts across Singapore. Zero DM hunting. One tap to join.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 mt-2">
            <a
              href="#events"
              className="flex items-center justify-center min-w-[220px] px-8 py-4 rounded-xl border border-transparent bg-white text-neutral-900 font-semibold text-lg text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:translate-y-0 active:scale-[0.98]"
            >
              Explore Experiences
            </a>
            <Link
              href="/host"
              className="flex items-center justify-center min-w-[220px] px-8 py-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/40 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] active:translate-y-0 active:scale-[0.98]"
            >
              Host Your Experience
            </Link>
          </div>
          <p className="text-sm text-white/40">
            Already leading workouts?{' '}
            <Link href="/host" className="underline underline-offset-4 hover:text-white/60 transition-colors">
              List yours here
            </Link>
          </p>
        </div>
      </section>

      {/* 2. HOW IT WORKS — Attendee 3-step flow with iPhone mockups */}
      <HowItWorks />

      {/* 3. SOCIAL PROOF — Category pills + Browse CTA */}
      <section id="events" className="px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { label: 'Run Clubs', category: 'running' },
                { label: 'Yoga', category: 'yoga' },
                { label: 'HIIT', category: 'hiit' },
                { label: 'Bootcamp', category: 'bootcamp' },
                { label: 'Hikes', category: 'hikes' },
              ].map(({ label, category }) => (
                <Link
                  key={category}
                  href={`/events?category=${category}`}
                  className="px-4 py-2 rounded-full border border-white/15 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
                >
                  {label}
                </Link>
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Find your next workout
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8">
              Strangers become regulars become friends. Something new every week across Singapore.
            </p>
            <Link
              href="/events"
              className="inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Browse Experiences
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* 4. FOR HOSTS — Standalone condensed host section */}
      <section id="for-hosts" className="px-6 py-24 sm:py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">
                For Fitness & Wellness Hosts
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Everything you need to run your community.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {hostValues.map((value, index) => (
              <ScrollReveal key={value.title} delay={index * 100}>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-white/60">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="text-center mt-12">
              <Link
                href="/host"
                className="inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Start Hosting — It&apos;s Free
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. CLOSING CTA — Single attendee call-to-action */}
      <section id="start" className="px-6 py-24 sm:py-32 border-t border-white/5">
        <ScrollReveal>
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready when you are.
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8">
              No membership required. Just show up and sweat.
            </p>
            <Link
              href="/events"
              className="inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Find Your Next Workout
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. FOOTER */}
      <Footer />
    </main>
  )
}
