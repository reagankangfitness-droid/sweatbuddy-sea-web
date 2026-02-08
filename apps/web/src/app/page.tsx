'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { ScrollReveal, StaggerReveal } from '@/components/ui/ScrollReveal'
import { IPhoneMockup } from '@/components/IPhoneMockup'
import { Footer } from '@/components/Footer'

const features = [
  {
    title: 'List in minutes',
    description:
      'Create your event page with all the details — location, timing, capacity, pricing — and share a single link. No back-and-forth.',
    image: '/images/list-in-minutes.jpeg',
  },
  {
    title: 'Signups that just work',
    description:
      'Attendees register and pay through one flow. You see who\'s coming in real time. No more screenshot receipts or manual headcounts.',
    image: '/images/attendees-dashboard.png',
  },
  {
    title: 'Know your community',
    description:
      'See who your regulars are, spot trends in attendance, and get AI-powered insights to help your community grow.',
    image: null,
  },
  {
    title: 'Get paid simply',
    description:
      'Free events stay free. For paid events, attendees pay through the platform and you get paid out automatically. No chasing.',
    image: null,
  },
]

const pricingItems = [
  'Unlimited events',
  'Unlimited attendees',
  'Full dashboard & analytics',
  'AI tools (content generator, growth insights, chat)',
  'Community management & loyalty tracking',
  'QR code check-in',
]

const values = [
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
      {/* 1. HERO */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero-1.webp)' }}
      >
        <div className="absolute inset-0 bg-black/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-2xl mx-auto gap-6">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
            For Fitness & Wellness Hosts in Southeast Asia
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Less admin.<br />More time with your crew.
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-lg">
            SweatBuddies gives you the tools to list events, manage signups, track your community, and get paid — so you can focus on what you actually love.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link
              href="/host"
              className="inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Start Hosting — It&apos;s Free
            </Link>
            <a
              href="#how-it-helps"
              className="inline-block px-6 py-3 rounded-xl border border-white/20 text-white/80 font-medium text-base text-center hover:bg-white/10 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 2. THE GENTLE HOOK */}
      <section id="the-problem" className="px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">
              Sound Familiar?
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
              You started this to bring people together. Not to wrestle with spreadsheets.
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed">
              Tracking RSVPs in WhatsApp. Chasing payments on PayNow. Manually counting heads. You got into fitness and wellness community building because you love it — but the admin is starting to feel like a second job.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. HOW IT HELPS */}
      <section id="how-it-helps" className="px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">
                What SweatBuddies Does for You
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Everything you need. Nothing you don&apos;t.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  {feature.image && (
                    <div className="flex justify-center py-8">
                      <IPhoneMockup className="scale-75 lg:scale-85">
                        <Image
                          src={feature.image}
                          alt={feature.title}
                          width={320}
                          height={650}
                          className="w-full h-full object-cover"
                        />
                      </IPhoneMockup>
                    </div>
                  )}
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY IT MATTERS */}
      <section
        id="why-it-matters"
        className="relative bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/organizers-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
        <div className="relative z-10 py-32 sm:py-40 px-6">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">
                Bigger Than a Platform
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
                Because the best part was never the logistics.
              </h2>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                It was the moment someone shows up for the first time and says &ldquo;I didn&apos;t think anyone would come.&rdquo; It was watching strangers become regulars become friends. We built SweatBuddies so you can have more of those moments — and less of the rest.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. GENTLE MOMENTUM */}
      <section id="momentum" className="px-6 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">
                Built for What&apos;s Next
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Built for the next generation of fitness and wellness hosts in Southeast Asia.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <ScrollReveal key={value.title} delay={index * 100}>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-white/60">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="px-6 py-24 sm:py-32">
        <div className="max-w-xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Simple. Honest. No surprises.
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-bold mb-8">Free for hosts. Always.</h3>

              <StaggerReveal className="flex flex-col gap-4 mb-8" staggerDelay={80}>
                {pricingItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-white/80">{item}</span>
                  </div>
                ))}
              </StaggerReveal>

              <p className="text-sm text-white/40 leading-relaxed mb-8">
                For paid events, a small service fee is applied to each ticket so we can keep the platform running. Free events are completely free — for you and your attendees.
              </p>

              <Link
                href="/host"
                className="inline-block w-full px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Get Started
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 7. THE INVITATION */}
      <section id="start" className="px-6 py-24 sm:py-32 border-t border-white/5">
        <ScrollReveal>
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready when you are.
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8">
              No pitch deck. No approval process. Just sign up, list your first event, and start building your community.
            </p>
            <Link
              href="/host"
              className="inline-block px-8 py-4 rounded-xl bg-white text-neutral-900 font-semibold text-lg text-center hover:bg-white/90 active:scale-[0.98] transition-all mb-4"
            >
              Start Hosting — It&apos;s Free
            </Link>
            <p className="text-sm text-white/40">
              <Link href="/events" className="underline underline-offset-4 hover:text-white/60 transition-colors">
                Or browse events as an attendee
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* 8. FOOTER */}
      <Footer />
    </main>
  )
}
