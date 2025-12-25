'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, Loader2, Calendar, Clock, MapPin, ExternalLink, X, MessageCircle } from 'lucide-react'
import { CancelRsvpModal } from '@/components/CancelRsvpModal'

interface EventDetails {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null
  time: string
  location: string
  organizer: string
  imageUrl: string | null
  recurring: boolean
  communityLink?: string | null
}

// Format date for display (e.g., "Sat, Jan 15")
function formatEventDate(dateStr: string | null | undefined, dayName: string): string {
  if (!dateStr) return dayName

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dayName

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dayName
  }
}

interface RSVPEvent {
  id: string
  eventId: string
  eventName: string
  rsvpDate: string
  event: EventDetails | null
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

// Helper to detect platform from community link
const detectPlatform = (url: string): 'whatsapp' | 'telegram' | 'other' => {
  if (url.includes('wa.me') || url.includes('whatsapp') || url.includes('chat.whatsapp')) {
    return 'whatsapp'
  }
  if (url.includes('t.me') || url.includes('telegram')) {
    return 'telegram'
  }
  return 'other'
}

export default function MyEventsPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true) // Start true for initial load
  const [error, setError] = useState('')
  const [events, setEvents] = useState<RSVPEvent[] | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Fetch events for a given email
  const fetchEvents = async (emailToFetch: string) => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/my-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToFetch }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setEvents(data.events)
      setSubmittedEmail(data.email)

      // Save email for future use
      localStorage.setItem('sweatbuddies_user', JSON.stringify({ email: data.email }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get events')
      setEvents(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-load events if email is saved in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialLoadDone) {
      const saved = localStorage.getItem('sweatbuddies_user')
      if (saved) {
        try {
          const { email: savedEmail } = JSON.parse(saved)
          if (savedEmail) {
            setEmail(savedEmail)
            // Auto-fetch events
            fetchEvents(savedEmail)
            setInitialLoadDone(true)
            return
          }
        } catch {
          // Invalid data, ignore
        }
      }
      // No saved email, stop loading
      setIsLoading(false)
      setInitialLoadDone(true)
    }
  }, [initialLoadDone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchEvents(email)
  }

  const handleReset = () => {
    setEvents(null)
    setSubmittedEmail('')
    setEmail('')
    // Clear localStorage so it doesn't auto-load next time
    localStorage.removeItem('sweatbuddies_user')
  }

  const activeEvents = events?.filter((e) => e.event) || []
  const pastEvents = events?.filter((e) => !e.event) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#3477f8]/10 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-[#3477f8]" />
          </div>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-neutral-900 mb-3">
            My Events
          </h1>
          <p className="text-neutral-600">
            {events === null
              ? "Enter your email to see all the events you've signed up for."
              : `Events for ${submittedEmail}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && events === null ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#3477f8] mb-4" />
            <p className="text-neutral-600">Loading your events...</p>
          </div>
        ) : events === null ? (
          /* Email Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-neutral-200 focus:border-[#3477f8] focus:ring-2 focus:ring-[#3477f8]/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-12 rounded-xl bg-[#3477f8] text-white font-semibold hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'View My Events'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Change email button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="text-sm text-[#3477f8] hover:underline font-medium"
              >
                Use different email
              </button>
            </div>

            {activeEvents.length === 0 && pastEvents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center text-3xl">
                  📅
                </div>
                <h2 className="font-sans font-semibold text-lg text-neutral-900 mb-2">
                  No events yet
                </h2>
                <p className="text-neutral-600 text-sm mb-6">
                  You haven&apos;t signed up for any events with this email yet.
                </p>
                <Link
                  href="/#events"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#3477f8] text-white font-semibold text-sm hover:bg-[#2563eb] transition-all"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <>
                {/* Active Events */}
                {activeEvents.length > 0 && (
                  <div>
                    <h2 className="font-sans font-semibold text-lg text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Your Events ({activeEvents.length})
                    </h2>
                    <div className="space-y-4">
                      {activeEvents.map((rsvp) => (
                        <EventCard
                          key={rsvp.id}
                          rsvp={rsvp}
                          email={submittedEmail}
                          onCancelSuccess={() => fetchEvents(submittedEmail)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past/Removed Events */}
                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="font-sans font-semibold text-lg text-neutral-500 mb-4">
                      Past Events ({pastEvents.length})
                    </h2>
                    <div className="space-y-3 opacity-60">
                      {pastEvents.map((rsvp) => (
                        <div
                          key={rsvp.id}
                          className="bg-white rounded-xl border border-neutral-100 p-4"
                        >
                          <p className="font-medium text-neutral-700">{rsvp.eventName}</p>
                          <p className="text-sm text-neutral-500 mt-1">
                            RSVP&apos;d on {new Date(rsvp.rsvpDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Browse more */}
            <div className="text-center pt-4">
              <Link
                href="/#events"
                className="inline-flex items-center gap-2 text-[#3477f8] font-medium hover:underline"
              >
                Browse more events
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Email note */}
            <p className="text-center text-sm text-neutral-500">
              We&apos;ve also sent you an email with a link to access this page anytime.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function EventCard({
  rsvp,
  email,
  onCancelSuccess
}: {
  rsvp: RSVPEvent
  email: string
  onCancelSuccess: () => void
}) {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const event = rsvp.event!
  const emoji = categoryEmojis[event.category] || '✨'

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow">
        <Link href={`/e/${event.id}`} className="block">
          <div className="flex">
            {/* Image */}
            <div className="relative w-24 sm:w-32 flex-shrink-0">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full min-h-[100px] bg-gradient-to-br from-[#3477f8]/10 to-[#3477f8]/5 flex items-center justify-center">
                  <span className="text-3xl">{emoji}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-sans font-semibold text-neutral-900 line-clamp-2">
                  {event.name}
                </h3>
                {event.recurring && (
                  <span className="flex-shrink-0 px-2 py-0.5 bg-[#3477f8]/10 text-[#3477f8] text-xs font-medium rounded-full">
                    Weekly
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>{formatEventDate(event.eventDate, event.day)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Actions Row */}
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 flex items-center justify-between">
          {/* Community Link */}
          {event.communityLink ? (
            <a
              href={event.communityLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white ${
                detectPlatform(event.communityLink) === 'whatsapp'
                  ? 'bg-[#25D366]'
                  : detectPlatform(event.communityLink) === 'telegram'
                  ? 'bg-[#0088cc]'
                  : 'bg-blue-600'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {detectPlatform(event.communityLink) === 'whatsapp'
                ? 'WhatsApp'
                : detectPlatform(event.communityLink) === 'telegram'
                ? 'Telegram'
                : 'Community'}
            </a>
          ) : (
            <div />
          )}

          {/* Cancel RSVP */}
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-sm text-neutral-400 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Cancel RSVP
          </button>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelRsvpModal
        isOpen={showCancelModal}
        eventId={event.id}
        eventName={event.name}
        email={email}
        onClose={() => setShowCancelModal(false)}
        onSuccess={onCancelSuccess}
      />
    </>
  )
}
