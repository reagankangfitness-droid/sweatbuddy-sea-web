'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroSection } from '@/components/landing/HeroSection'
import { PainPointsSection } from '@/components/landing/PainPointsSection'
import { JourneySection } from '@/components/landing/JourneySection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { BuiltForSection } from '@/components/landing/BuiltForSection'
import { SocialProofBanner } from '@/components/landing/SocialProofBanner'
import { FinalCTASection } from '@/components/landing/FinalCTASection'
import { PhotoStrip } from '@/components/landing/PhotoStrip'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
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
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-dark text-white font-sans">
      <LandingNav />
      <HeroSection />
      <PhotoStrip />
      <PainPointsSection />
      <JourneySection />
      <FeaturesSection />
      <BuiltForSection />
      <SocialProofBanner />
      <FinalCTASection />
      <LandingFooter />
    </main>
  )
}
