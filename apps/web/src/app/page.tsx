import dynamicImport from 'next/dynamic'
import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
import { Mission } from '@/components/Mission'
import { Events } from '@/components/Events'
import { getEvents } from '@/lib/events'
import { MobileHeroSkeleton, MobileEventsListSkeleton } from '@/components/Skeletons'

// Mobile-first components - with loading skeletons
const MobileHeader = dynamicImport(() => import('@/components/MobileHeader').then(mod => ({ default: mod.MobileHeader })), {
  ssr: true,
})
const MobileHero = dynamicImport(() => import('@/components/MobileHero').then(mod => ({ default: mod.MobileHero })), {
  loading: () => <MobileHeroSkeleton />,
  ssr: true,
})
const MobileEventsSection = dynamicImport(() => import('@/components/MobileEventsSection').then(mod => ({ default: mod.MobileEventsSection })), {
  loading: () => <MobileEventsListSkeleton count={3} />,
  ssr: true,
})

// Dynamically import below-the-fold components for better initial load
const HostCTA = dynamicImport(() => import('@/components/HostCTA').then(mod => ({ default: mod.HostCTA })), {
  loading: () => <div className="py-16" />,
})
const Footer = dynamicImport(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="py-10" />,
})
const ClientComponents = dynamicImport(() => import('@/components/ClientComponents').then(mod => ({ default: mod.ClientComponents })))

// ISR - revalidate every 60 seconds for fresh data with caching
export const revalidate = 60

export default async function Home() {
  // Server-side data fetching - no loading spinner needed
  const events = await getEvents()

  return (
    <>
      {/* Mobile Layout - Native App Feel */}
      <div className="md:hidden min-h-screen bg-neutral-50">
        <MobileHeader />
        <MobileHero />
        <HowItWorks />
        <Mission />
        <MobileEventsSection events={events} />
        <HostCTA />
        <Footer />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Header />
        <main>
          <Hero />
          <HowItWorks />
          <Mission />
          <Events initialEvents={events} />
          <HostCTA />
        </main>
        <Footer />
        <ClientComponents />
      </div>
    </>
  )
}
