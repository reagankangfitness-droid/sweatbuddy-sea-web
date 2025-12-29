import dynamicImport from 'next/dynamic'
import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { ActivityMarquee } from '@/components/ActivityMarquee'
import { HowItWorks } from '@/components/HowItWorks'
import { Events } from '@/components/Events'
import { getEvents, getSocialProofStats } from '@/lib/events'
import { SocialProofBar } from '@/components/SocialProofBar'
import { MobileHeroSkeleton, MobileEventsListSkeleton } from '@/components/Skeletons'

// Mobile-first components - with loading skeletons
const MobileHeader = dynamicImport(() => import('@/components/MobileHeader').then(mod => ({ default: mod.MobileHeader })), {
  ssr: true, // Keep SSR for header
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
const Cities = dynamicImport(() => import('@/components/Cities').then(mod => ({ default: mod.Cities })), {
  loading: () => <div className="py-20" />,
})
const Mission = dynamicImport(() => import('@/components/Mission').then(mod => ({ default: mod.Mission })), {
  loading: () => <div className="py-20" />,
})
const ForOrganizers = dynamicImport(() => import('@/components/ForOrganizers').then(mod => ({ default: mod.ForOrganizers })), {
  loading: () => <div className="py-20" />,
})
const SubmitForm = dynamicImport(() => import('@/components/SubmitForm').then(mod => ({ default: mod.SubmitForm })), {
  loading: () => <div className="py-20" />,
})
const Newsletter = dynamicImport(() => import('@/components/Newsletter').then(mod => ({ default: mod.Newsletter })), {
  loading: () => <div className="py-20" />,
})
const Footer = dynamicImport(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="py-10" />,
})
const ClientComponents = dynamicImport(() => import('@/components/ClientComponents').then(mod => ({ default: mod.ClientComponents })))
const StickyNewsletterBar = dynamicImport(() => import('@/components/StickyNewsletterBar').then(mod => ({ default: mod.StickyNewsletterBar })))

// ISR - revalidate every 60 seconds for fresh data with caching
export const revalidate = 60

export default async function Home() {
  // Server-side data fetching - no loading spinner needed
  const [events, socialProofStats] = await Promise.all([
    getEvents(),
    getSocialProofStats(),
  ])

  return (
    <>
      {/* Mobile Layout - Native App Feel */}
      <div className="md:hidden min-h-screen bg-neutral-50">
        <MobileHeader />
        <MobileHero />
        <SocialProofBar stats={socialProofStats} />
        <MobileEventsSection events={events} />
        <div id="submit-mobile">
          <SubmitForm />
        </div>
        <Newsletter />
        <Footer />
      </div>

      {/* Desktop Layout - Original Design */}
      <div className="hidden md:block">
        <Header />
        <main>
          <Hero />
          <SocialProofBar stats={socialProofStats} />
          <ActivityMarquee />
          <HowItWorks />
          <Events initialEvents={events} />
          <Cities />
          <Mission />
          <ForOrganizers />
          <div id="submit-desktop">
            <SubmitForm />
          </div>
          <Newsletter />
        </main>
        <Footer />
        <ClientComponents />
        <StickyNewsletterBar />
      </div>
    </>
  )
}
