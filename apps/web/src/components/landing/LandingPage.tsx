'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LandingNav } from './LandingNav'
import { HeroSection } from './HeroSection'
import { HappeningSection } from './HappeningSection'
import { HowItWorksSection } from './HowItWorksSection'
import { VibeSection } from './VibeSection'
import { HostsSection } from './HostsSection'
import { HostCTASection } from './HostCTASection'
import { GrowingSection } from './GrowingSection'
import { FinalCTASection } from './FinalCTASection'
import { LandingFooter } from './LandingFooter'
import type { UpcomingEvent } from './EventCard'

interface LandingData {
  eventCount: number
  hostCount: number
  upcomingEvents: UpcomingEvent[]
}

export function LandingPage({ data }: { data: LandingData }) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/events')
    }
  }, [isLoaded, isSignedIn, router])

  // Show nothing while checking auth to avoid flash
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <LandingNav />
      <HeroSection />
      <HappeningSection events={data.upcomingEvents} />
      <HowItWorksSection />
      <VibeSection />
      <HostsSection />
      <HostCTASection />
      <GrowingSection hostCount={data.hostCount} />
      <FinalCTASection />
      <LandingFooter />
    </main>
  )
}
