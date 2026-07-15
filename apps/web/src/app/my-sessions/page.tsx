'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarPlus, MapPin, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { LogoWithText } from '@/components/logo'

const EMOJI_MAP = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.emoji]))

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  running: ['#EA580C', '#9A3412'],
  yoga: ['#9333EA', '#581C87'],
  hiit: ['#DC2626', '#991B1B'],
  bootcamp: ['#DC2626', '#7F1D1D'],
  cycling: ['#CA8A04', '#854D0E'],
  swimming: ['#0891B2', '#155E75'],
  volleyball: ['#D97706', '#92400E'],
  basketball: ['#EA580C', '#7C2D12'],
  pilates: ['#DB2777', '#831843'],
  hiking: ['#65A30D', '#3F6212'],
  strength: ['#4F46E5', '#312E81'],
  gym: ['#2563EB', '#1E3A5F'],
  cold_plunge: ['#0284C7', '#0C4A6E'],
  dance_fitness: ['#C026D3', '#701A75'],
  badminton: ['#059669', '#064E3B'],
  padel: ['#0D9488', '#134E4A'],
  combat_fitness: ['#E11D48', '#881337'],
  pickleball: ['#16A34A', '#14532D'],
  other: ['#525252', '#262626'],
}

interface SessionData {
  id: string
  title: string
  imageUrl: string | null
  categorySlug: string | null
  startTime: string | null
  endTime: string | null
  address: string | null
  city: string
  latitude: number | null
  longitude: number | null
  host: { name: string | null; imageUrl: string | null }
  community: { name: string; slug: string; logoImage: string | null } | null
  attendeeCount: number
  userStatus: 'JOINED' | 'HOSTING'
}

function getCountdown(startTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()

  if (diffMs <= 0) return 'Starting soon'

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return 'Starting soon'
  if (diffHours < 24) return `In ${diffHours} hour${diffHours === 1 ? '' : 's'}`
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays} days`
}

function buildCalendarUrl(session: SessionData): string {
  const formatGCal = (dateStr: string) => {
    const d = new Date(dateStr)
    return d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  }

  const start = session.startTime ? formatGCal(session.startTime) : ''
  const end = session.endTime ? formatGCal(session.endTime) : start
  const location = session.address || session.city || ''
  const details = `https://sweatbuddies.co/activities/${session.id}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${start}/${end}`,
    location,
    details,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function MySessionsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [upcoming, setUpcoming] = useState<SessionData[]>([])
  const [past, setPast] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false)
      return
    }

    const timer = window.setTimeout(() => setAuthTimedOut(true), 2200)
    return () => window.clearTimeout(timer)
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    fetch('/api/buddy/sessions/mine')
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setUpcoming(data.upcoming ?? [])
        setPast(data.past ?? [])
      })
      .catch(() => {
        setUpcoming([])
        setPast([])
      })
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  const showSignedOut = (isLoaded && !isSignedIn) || (!isLoaded && authTimedOut)

  if (!isLoaded && !authTimedOut) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#666] animate-spin" />
      </div>
    )
  }

  if (showSignedOut) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] px-4 text-white">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center py-10">
          <Link
            href="/"
            aria-label="SweatBuddies home"
            className="mb-10 inline-flex min-h-11 items-center"
          >
            <LogoWithText size={28} color="#FFFFFF" textColor="#FFFFFF" />
          </Link>
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-2xl shadow-black/30">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
              Your plans
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white">
              Save the sessions you are joining.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Sign in to see upcoming plans, calendar links, host details, and the people signals
              that make showing up easier.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {['Upcoming', 'Hosted', 'Past'].map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <p className="truncate font-mono text-[10px] font-black uppercase tracking-wide text-white/60">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
              >
                Sign in
              </Link>
              <Link
                href="/buddy"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-bold text-white transition-colors hover:border-[#63FF8F]/60"
              >
                Explore events
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-lg border-b border-[#333333]">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/profile"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0D0D0D] border border-[#333333]"
            >
              <ArrowLeft className="w-5 h-5 text-[#999999]" />
            </Link>
            <h1 className="text-sm font-semibold text-white uppercase tracking-wider">
              My Sessions
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-28 px-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#666] animate-spin" />
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <section className="mb-10">
              <h2 className="text-xs font-semibold text-[#666666] uppercase tracking-wider px-1 mb-3">
                Upcoming
              </h2>

              {upcoming.length === 0 ? (
                <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] p-6 text-center">
                  <p className="text-[#999] text-sm mb-4">
                    No upcoming sessions. Find one to show up to.
                  </p>
                  <Link
                    href="/buddy"
                    className="inline-block px-5 py-2.5 bg-white text-black font-semibold rounded-full text-sm"
                  >
                    Find a Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((session) => {
                    const emoji = EMOJI_MAP[session.categorySlug ?? 'other'] ?? '🏃'
                    const grad =
                      CATEGORY_GRADIENTS[session.categorySlug ?? 'other'] ??
                      CATEGORY_GRADIENTS.other

                    return (
                      <div
                        key={session.id}
                        className="bg-[#1A1A1A] rounded-2xl border border-[#333333] overflow-hidden"
                      >
                        {/* Image / Gradient fallback */}
                        <Link href={`/activities/${session.id}`}>
                          {session.imageUrl ? (
                            <div className="relative h-36 w-full">
                              <Image
                                src={session.imageUrl}
                                alt={session.title}
                                fill
                                className="object-cover"
                              />
                              {session.userStatus === 'HOSTING' && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-full">
                                  Hosting
                                </span>
                              )}
                            </div>
                          ) : (
                            <div
                              className="h-36 w-full flex flex-col items-center justify-center relative"
                              style={{
                                background: `linear-gradient(145deg, ${grad[0]}, ${grad[1]})`,
                              }}
                            >
                              <span className="text-4xl drop-shadow-lg mb-1">{emoji}</span>
                              <p className="text-xs font-bold text-white/80 uppercase tracking-wider line-clamp-1 px-4">
                                {session.title}
                              </p>
                              {session.userStatus === 'HOSTING' && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-full">
                                  Hosting
                                </span>
                              )}
                            </div>
                          )}
                        </Link>

                        <div className="p-4">
                          <Link href={`/activities/${session.id}`}>
                            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                              {session.title}
                            </h3>
                          </Link>

                          {/* Countdown */}
                          {session.startTime && (
                            <p className="text-xs font-semibold text-amber-400 mb-1">
                              {getCountdown(session.startTime)}
                            </p>
                          )}

                          {/* Date */}
                          {session.startTime && (
                            <p className="text-xs text-[#999] mb-1">
                              {format(new Date(session.startTime), "EEE, MMM d '\u00B7' h:mm a")}
                            </p>
                          )}

                          {/* Location */}
                          {(session.address || session.city) && (
                            <p className="text-xs text-[#666] flex items-center gap-1 mb-3">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {session.address || session.city}
                              </span>
                            </p>
                          )}

                          {/* Host / Community */}
                          <p className="text-[11px] text-[#666] mb-3">
                            {session.community
                              ? `${session.community.name}`
                              : session.host.name
                                ? `Hosted by ${session.host.name}`
                                : 'SweatBuddies Session'}
                          </p>

                          {/* Add to Calendar */}
                          {session.startTime && (
                            <a
                              href={buildCalendarUrl(session)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black font-semibold rounded-full text-xs hover:bg-white/90 transition-colors"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              Add to Calendar
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Past */}
            <section>
              <h2 className="text-xs font-semibold text-[#666666] uppercase tracking-wider px-1 mb-3">
                Past
              </h2>

              {past.length === 0 ? (
                <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] p-6 text-center">
                  <p className="text-[#999] text-sm">No sessions yet. Your first one is waiting.</p>
                </div>
              ) : (
                <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] overflow-hidden divide-y divide-[#333333]">
                  {past.map((session) => (
                    <div key={session.id} className="px-4 py-3.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <Link href={`/activities/${session.id}`}>
                          <h3 className="text-white text-sm font-medium line-clamp-1">
                            {session.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#666] mt-0.5">
                          {session.startTime
                            ? format(new Date(session.startTime), 'MMM d, yyyy')
                            : 'Date TBD'}
                          {session.host.name ? ` \u00B7 ${session.host.name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          href={`/activities/${session.id}/recap`}
                          className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap font-medium"
                        >
                          View Recap
                        </Link>
                        <Link
                          href={`/activities/${session.id}`}
                          className="text-[11px] text-[#999] hover:text-white transition-colors whitespace-nowrap"
                        >
                          Leave a review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <div className="h-20" />
    </div>
  )
}
