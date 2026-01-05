import dynamicImport from 'next/dynamic'
import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
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
const SocialProof = dynamicImport(() => import('@/components/SocialProof').then(mod => ({ default: mod.SocialProof })), {
  loading: () => <div className="py-16" />,
})
const FirstTimerFAQ = dynamicImport(() => import('@/components/FirstTimerFAQ').then(mod => ({ default: mod.FirstTimerFAQ })), {
  loading: () => <div className="py-16" />,
})
const ValueProps = dynamicImport(() => import('@/components/ValueProps').then(mod => ({ default: mod.ValueProps })), {
  loading: () => <div className="py-16" />,
})
const Newsletter = dynamicImport(() => import('@/components/Newsletter').then(mod => ({ default: mod.Newsletter })), {
  loading: () => <div className="py-16" />,
})
const FinalCTA = dynamicImport(() => import('@/components/FinalCTA').then(mod => ({ default: mod.FinalCTA })), {
  loading: () => <div className="py-20" />,
})
const Footer = dynamicImport(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="py-10" />,
})
const SubmitForm = dynamicImport(() => import('@/components/SubmitForm').then(mod => ({ default: mod.SubmitForm })), {
  loading: () => <div className="py-20" />,
})
const ClientComponents = dynamicImport(() => import('@/components/ClientComponents').then(mod => ({ default: mod.ClientComponents })))
const StickyNewsletterBar = dynamicImport(() => import('@/components/StickyNewsletterBar').then(mod => ({ default: mod.StickyNewsletterBar })))

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
        <MobileEventsSection events={events} />
        <SocialProof />
        <FirstTimerFAQ />
        <ValueProps />
        <Newsletter />
        <FinalCTA />
        <div id="submit-mobile">
          <SubmitForm />
        </div>
        <Footer />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Header />
        <main>
          <Hero />
          <HowItWorks />
          <Events initialEvents={events} />
          <SocialProof />
          <FirstTimerFAQ />
          <ValueProps />
          <Newsletter />
          <FinalCTA />
          <div id="submit-desktop">
            <SubmitForm />
          </div>
        </main>
        <Footer />
        <ClientComponents />
        <StickyNewsletterBar />
      </div>
    </>
  )
}
