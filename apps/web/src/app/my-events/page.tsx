'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, Loader2, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react'

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

export default function MyEventsPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<RSVPEvent[] | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')

  // Pre-fill email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sweatbuddies_user')
      if (saved) {
        try {
          const { email: savedEmail } = JSON.parse(saved)
          if (savedEmail) {
            setEmail(savedEmail)
          }
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/my-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setEvents(null)
    setSubmittedEmail('')
    setEmail('')
  }

  const activeEvents = events?.filter((e) => e.event) || []
  const pastEvents = events?.filter((e) => !e.event) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <Link href="/" className="font-heading font-bold text-xl text-gray-900">
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
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 mb-3">
            My Events
          </h1>
          <p className="text-gray-600">
            {events === null
              ? "Enter your email to see all the events you've signed up for."
              : `Events for ${submittedEmail}`}
          </p>
        </div>

        {/* Email Form or Events */}
        {events === null ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:border-[#3477f8] focus:ring-2 focus:ring-[#3477f8]/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                  📅
                </div>
                <h2 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  No events yet
                </h2>
                <p className="text-gray-600 text-sm mb-6">
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
                    <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Your Events ({activeEvents.length})
                    </h2>
                    <div className="space-y-4">
                      {activeEvents.map((rsvp) => (
                        <EventCard key={rsvp.id} rsvp={rsvp} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past/Removed Events */}
                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="font-heading font-semibold text-lg text-gray-500 mb-4">
                      Past Events ({pastEvents.length})
                    </h2>
                    <div className="space-y-3 opacity-60">
                      {pastEvents.map((rsvp) => (
                        <div
                          key={rsvp.id}
                          className="bg-white rounded-xl border border-gray-100 p-4"
                        >
                          <p className="font-medium text-gray-700">{rsvp.eventName}</p>
                          <p className="text-sm text-gray-500 mt-1">
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
            <p className="text-center text-sm text-gray-500">
              We&apos;ve also sent you an email with a link to access this page anytime.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function EventCard({ rsvp }: { rsvp: RSVPEvent }) {
  const event = rsvp.event!
  const emoji = categoryEmojis[event.category] || '✨'

  return (
    <Link
      href={`/e/${event.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
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
            <h3 className="font-heading font-semibold text-gray-900 line-clamp-2">
              {event.name}
            </h3>
            {event.recurring && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-[#3477f8]/10 text-[#3477f8] text-xs font-medium rounded-full">
                Weekly
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatEventDate(event.eventDate, event.day)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
