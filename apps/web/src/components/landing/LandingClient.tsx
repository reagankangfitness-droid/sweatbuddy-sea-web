'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { LogoWithText } from '@/components/logo'

interface UpcomingEvent {
  id: string
  slug: string | null
  eventName: string
  category: string
  eventDate: string | null
  time: string
  location: string
  imageUrl: string | null
  organizerName: string
  isFree: boolean
  price: number | null
  currency: string | null
}

interface LandingData {
  eventCount: number
  hostCount: number
  upcomingEvents: UpcomingEvent[]
}

export function LandingClient({ data }: { data: LandingData }) {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  const showSocialProof = data.eventCount >= 10 && data.hostCount >= 5
  const showEvents = data.upcomingEvents.length >= 3

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-8 py-4 backdrop-blur-xl bg-white/80 border-b border-neutral-100 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <LogoWithText size={28} />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/sign-in"
            className="text-neutral-500 font-medium text-sm hover:text-neutral-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/events"
            className="hidden sm:inline-flex text-neutral-600 font-medium text-sm hover:text-neutral-900 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </nav>

      {/* ============ VIEWPORT 1: HERO ============ */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-[2rem] sm:text-[3rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-neutral-900 mb-4 sm:mb-5">
            Host fitness events.{' '}
            <span className="text-neutral-400">Build your community. Get paid.</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-lg mx-auto mb-8 sm:mb-10">
            Create events, collect payments, and grow your fitness community — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/host"
              className="inline-flex items-center justify-center bg-neutral-900 text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-neutral-700 transition-colors"
            >
              Start Hosting — It&apos;s Free
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center border border-neutral-300 text-neutral-700 px-8 py-3.5 rounded-full font-semibold text-base hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              Browse Events
            </Link>
          </div>

          {/* Social proof line */}
          {showSocialProof && (
            <p className="mt-6 text-sm text-neutral-400">
              Join {data.hostCount}+ hosts and {data.eventCount}+ events across Singapore
            </p>
          )}
        </div>
      </section>

      {/* ============ VIEWPORT 2: HOW IT WORKS ============ */}
      <section className="py-16 sm:py-20 px-5 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center mb-10 sm:mb-12">
            How it works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">
                <span role="img" aria-label="Create">&#x1f4dd;</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Create your event</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Set up in under 5 minutes. Add title, time, location, and price.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">
                <span role="img" aria-label="Share">&#x1f4f1;</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Share & grow</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Get shareable flyers, tracked links, and AI-written descriptions.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">
                <span role="img" aria-label="Get paid">&#x1f4b0;</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Get paid</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Collect payments through Stripe or PayNow. We handle everything.
              </p>
            </div>
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/host"
              className="inline-flex items-center justify-center bg-neutral-900 text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-neutral-700 transition-colors"
            >
              Start Hosting — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* ============ VIEWPORT 3: LIVE EVENTS ============ */}
      {showEvents && (
        <section className="py-16 sm:py-20 px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center mb-8 sm:mb-10">
              Happening soon in Singapore
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.upcomingEvents.map((event) => (
                <LandingEventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                See all events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="py-10 px-5 border-t border-neutral-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <LogoWithText size={24} />
            <nav className="flex items-center gap-5 text-sm text-neutral-500">
              <Link href="/events" className="hover:text-neutral-900 transition-colors">Events</Link>
              <Link href="/communities" className="hover:text-neutral-900 transition-colors">Community</Link>
              <Link href="/host" className="hover:text-neutral-900 transition-colors">Host</Link>
              <Link href="/support" className="hover:text-neutral-900 transition-colors">Support</Link>
            </nav>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6 text-xs text-neutral-400">
            <span>Made in Singapore &#x1f1f8;&#x1f1ec;</span>
            <a
              href="https://instagram.com/_sweatbuddies"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-600 transition-colors"
            >
              @_sweatbuddies
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

// ============ MINI EVENT CARD ============

function LandingEventCard({ event }: { event: UpcomingEvent }) {
  const href = event.slug ? `/e/${event.slug}` : `/e/${event.id}`
  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-SG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Singapore',
      })
    : null

  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:border-neutral-300 hover:shadow-lg transition-all group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.eventName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <span className="text-3xl">
              {event.category === 'running' ? '\u{1F3C3}' :
               event.category === 'yoga' ? '\u{1F9D8}' :
               event.category === 'bootcamp' ? '\u{1F525}' :
               '\u{1F4AA}'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 leading-tight">
          {event.eventName}
        </h3>

        {eventDate && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-neutral-500">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{eventDate} at {event.time}</span>
          </div>
        )}

        <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        <p className="text-xs text-neutral-400 mt-1.5 truncate">
          by {event.organizerName}
        </p>
      </div>
    </Link>
  )
}
