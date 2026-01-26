import dynamicImport from 'next/dynamic'
import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { Mission } from '@/components/Mission'
import { Events } from '@/components/Events'
import { getEvents } from '@/lib/events'
import { MobileHeroSkeleton } from '@/components/Skeletons'

// Mobile-first components - with loading skeletons
const MobileHeader = dynamicImport(() => import('@/components/MobileHeader').then(mod => ({ default: mod.MobileHeader })), {
  ssr: true,
})

// Map-first components
const MiniHero = dynamicImport(() => import('@/components/home/MiniHero').then(mod => ({ default: mod.MiniHero })), {
  loading: () => <div className="bg-neutral-950 pt-20 pb-8 px-5 h-32" />,
  ssr: true,
})
const MapSection = dynamicImport(() => import('@/components/home/MapSection').then(mod => ({ default: mod.MapSection })), {
  loading: () => <div className="px-4 py-6 h-[600px] bg-neutral-50" />,
  ssr: false, // Client-only for map interactivity
})

// Legacy mobile components (kept for fallback)
const MobileHero = dynamicImport(() => import('@/components/MobileHero').then(mod => ({ default: mod.MobileHero })), {
  loading: () => <MobileHeroSkeleton />,
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

// ISR - revalidate every 10 seconds for fast event updates
export const revalidate = 10

export default async function Home() {
  // Server-side data fetching - for desktop fallback
  const events = await getEvents()

  return (
    <>
      {/* Mobile Layout - Map-First Experience */}
      <div className="md:hidden min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <MobileHeader />
        <MiniHero />
        <MapSection />
        <HostCTA />
        <Footer />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Header />
        <main>
          <Hero />
          <Mission id="mission" />
          <Events initialEvents={events} />
          <HostCTA />
        </main>
        <Footer />
        <ClientComponents />
      </div>
    </>
  )
}
