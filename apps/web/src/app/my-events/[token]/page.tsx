'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Clock, MapPin, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

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

interface VerifyResponse {
  success: boolean
  email: string
  events: RSVPEvent[]
  error?: string
}

import { getCategoryEmoji } from '@/lib/categories'

export default function MyEventsViewPage() {
  const params = useParams()
  const token = params.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<VerifyResponse | null>(null)

  useEffect(() => {
    async function verifyToken() {
      try {
        const response = await fetch(`/api/my-events/verify?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Invalid link')
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      verifyToken()
    }
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3477f8] mx-auto mb-4" />
          <p className="text-neutral-600">Loading your experiences...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/my-events"
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

        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-neutral-900 mb-3">
            Link Expired or Invalid
          </h1>
          <p className="text-neutral-600 mb-8">{error}</p>
          <Link
            href="/my-events"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#3477f8] text-white font-semibold hover:bg-[#2563eb] transition-all"
          >
            Request a new link
          </Link>
        </main>
      </div>
    )
  }

  const activeEvents = data?.events.filter((e) => e.event) || []
  const pastEvents = data?.events.filter((e) => !e.event) || []

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
              <span className="font-medium">Home</span>
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
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-neutral-900 mb-2">
            My Experiences
          </h1>
          <p className="text-neutral-600">
            Events for <strong>{data?.email}</strong>
          </p>
        </div>

        {activeEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center text-3xl">
              📅
            </div>
            <h2 className="font-sans font-semibold text-lg text-neutral-900 mb-2">
              No experiences yet
            </h2>
            <p className="text-neutral-600 text-sm mb-6">
              You haven&apos;t signed up for any experiences yet.
            </p>
            <Link
              href="/#events"
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#3477f8] text-white font-semibold text-sm hover:bg-[#2563eb] transition-all"
            >
              Browse Experiences
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Events */}
            {activeEvents.length > 0 && (
              <div>
                <h2 className="font-sans font-semibold text-lg text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Upcoming Experiences ({activeEvents.length})
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
                <h2 className="font-sans font-semibold text-lg text-neutral-500 mb-4">
                  Past Experiences ({pastEvents.length})
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
          </div>
        )}

        {/* Browse more */}
        <div className="mt-12 text-center">
          <Link
            href="/#events"
            className="inline-flex items-center gap-2 text-[#3477f8] font-medium hover:underline"
          >
            Browse more experiences
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}

function EventCard({ rsvp }: { rsvp: RSVPEvent }) {
  const event = rsvp.event!
  const emoji = getCategoryEmoji(event.category)

  return (
    <Link
      href={`/e/${event.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow"
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
            <div className="w-full h-full bg-gradient-to-br from-[#3477f8]/10 to-[#3477f8]/5 flex items-center justify-center">
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
  )
}
