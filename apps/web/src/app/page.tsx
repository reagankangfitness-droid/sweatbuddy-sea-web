import dynamic from 'next/dynamic'
import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { ActivityMarquee } from '@/components/ActivityMarquee'
import { HowItWorks } from '@/components/HowItWorks'
import { Events } from '@/components/Events'
import { getEvents } from '@/lib/events'
import { MobileHeroSkeleton, MobileEventsListSkeleton } from '@/components/Skeletons'

// Mobile-first components - with loading skeletons
const MobileHeader = dynamic(() => import('@/components/MobileHeader').then(mod => ({ default: mod.MobileHeader })), {
  ssr: true, // Keep SSR for header
})
const MobileHero = dynamic(() => import('@/components/MobileHero').then(mod => ({ default: mod.MobileHero })), {
  loading: () => <MobileHeroSkeleton />,
  ssr: true,
})
const MobileEventsSection = dynamic(() => import('@/components/MobileEventsSection').then(mod => ({ default: mod.MobileEventsSection })), {
  loading: () => <MobileEventsListSkeleton count={3} />,
  ssr: true,
})
const BottomNav = dynamic(() => import('@/components/BottomNav').then(mod => ({ default: mod.BottomNav })), {
  ssr: false, // No SSR needed for bottom nav
})

// Dynamically import below-the-fold components for better initial load
const Cities = dynamic(() => import('@/components/Cities').then(mod => ({ default: mod.Cities })), {
  loading: () => <div className="py-20" />,
})
const Mission = dynamic(() => import('@/components/Mission').then(mod => ({ default: mod.Mission })), {
  loading: () => <div className="py-20" />,
})
const ForOrganizers = dynamic(() => import('@/components/ForOrganizers').then(mod => ({ default: mod.ForOrganizers })), {
  loading: () => <div className="py-20" />,
})
const SubmitForm = dynamic(() => import('@/components/SubmitForm').then(mod => ({ default: mod.SubmitForm })), {
  loading: () => <div className="py-20" />,
})
const Newsletter = dynamic(() => import('@/components/Newsletter').then(mod => ({ default: mod.Newsletter })), {
  loading: () => <div className="py-20" />,
})
const Footer = dynamic(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="py-10" />,
})
const ClientComponents = dynamic(() => import('@/components/ClientComponents').then(mod => ({ default: mod.ClientComponents })))
const StickyNewsletterBar = dynamic(() => import('@/components/StickyNewsletterBar').then(mod => ({ default: mod.StickyNewsletterBar })))

// Revalidate every 60 seconds for faster updates after edits
export const revalidate = 60

export default async function Home() {
  // Server-side data fetching - no loading spinner needed
  const events = await getEvents()

  return (
    <>
      {/* Mobile Layout - Native App Feel */}
      <div className="md:hidden min-h-screen bg-sand">
        <MobileHeader />
        <MobileHero />
        <MobileEventsSection events={events} />
        <SubmitForm />
        <Newsletter />
        <Footer />
        <BottomNav />
      </div>

      {/* Desktop Layout - Original Design */}
      <div className="hidden md:block">
        <Header />
        <main>
          <Hero />
          <ActivityMarquee />
          <HowItWorks />
          <Events initialEvents={events} />
          <Cities />
          <Mission />
          <ForOrganizers />
          <SubmitForm />
          <Newsletter />
        </main>
        <Footer />
        <ClientComponents />
        <StickyNewsletterBar />
      </div>
    </>
  )
}
