'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  ArrowLeft, Calendar, MapPin, Loader2, Clock, ChevronRight, CalendarDays,
  History, Navigation, CalendarPlus, X, Flame, Trophy, User
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface BookedEvent {
  id: string
  status: string
  createdAt: string
  activity: {
    id: string
    slug?: string
    title: string
    type: string
    city: string
    startTime: string | null
    endTime: string | null
    imageUrl: string | null
    latitude?: number | null
    longitude?: number | null
    host?: {
      name: string
      instagram?: string | null
    }
  }
}

// Calculate time until event
function getTimeUntil(dateStr: string): string {
  const now = new Date()
  const eventDate = new Date(dateStr)
  const diffMs = eventDate.getTime() - now.getTime()

  if (diffMs < 0) return 'Started'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `In ${diffMins} min`
  }
  if (diffHours < 24) {
    return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  if (diffDays === 1) {
    return 'Tomorrow'
  }
  if (diffDays < 7) {
    return `In ${diffDays} days`
  }
  return `In ${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''}`
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Generate calendar URLs
function generateCalendarUrl(booking: BookedEvent, type: 'google' | 'apple'): string {
  const { activity } = booking
  if (!activity.startTime) return '#'

  const startDate = new Date(activity.startTime)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Default 1 hour

  const title = encodeURIComponent(activity.title)
  const location = encodeURIComponent(activity.city)
  const description = encodeURIComponent(`Booked via SweatBuddies\n\nHost: ${activity.host?.name || 'TBD'}`)

  if (type === 'google') {
    const startStr = startDate.toISOString().replace(/-|:|\.\d{3}/g, '')
    const endStr = endDate.toISOString().replace(/-|:|\.\d{3}/g, '')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&location=${location}&details=${description}`
  }

  // Apple Calendar (ICS format data URL)
  const formatICSDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1) + 'Z'
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${activity.title}
LOCATION:${activity.city}
DESCRIPTION:Booked via SweatBuddies - Host: ${activity.host?.name || 'TBD'}
END:VEVENT
END:VCALENDAR`

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
}

// Open directions in maps
function openDirections(lat?: number | null, lng?: number | null, address?: string) {
  if (lat && lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  } else if (address) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
  }
}

// Next Event Highlight Card
function NextEventCard({ booking }: { booking: BookedEvent }) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false)

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-4 mb-6 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
            Next Up
          </span>
          <span className="text-xs text-white/70">
            {booking.activity.startTime && getTimeUntil(booking.activity.startTime)}
          </span>
        </div>

        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
            {booking.activity.imageUrl ? (
              <Image
                src={booking.activity.imageUrl}
                alt={booking.activity.title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-white/40" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">
              {booking.activity.type}
            </p>
            <h3 className="font-semibold text-lg line-clamp-1 mb-1">
              {booking.activity.title}
            </h3>
            {booking.activity.startTime && (
              <p className="text-sm text-white/80 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDateLabel(booking.activity.startTime)} at {formatTime(booking.activity.startTime)}
              </p>
            )}
            {booking.activity.host && (
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                <User className="w-3 h-3" />
                {booking.activity.host.name}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => openDirections(booking.activity.latitude, booking.activity.longitude, booking.activity.city)}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </button>
          <div className="relative flex-1">
            <button
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-neutral-900 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Add to Calendar
            </button>

            {/* Calendar dropdown */}
            {showCalendarMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendarMenu(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
                  <a
                    href={generateCalendarUrl(booking, 'google')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
                    onClick={() => setShowCalendarMenu(false)}
                  >
                    <span className="text-lg">📅</span>
                    Google Calendar
                  </a>
                  <a
                    href={generateCalendarUrl(booking, 'apple')}
                    download={`${booking.activity.title.replace(/\s+/g, '-')}.ics`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm border-t border-neutral-100 dark:border-neutral-700"
                    onClick={() => setShowCalendarMenu(false)}
                  >
                    <span className="text-lg">🍎</span>
                    Apple Calendar
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stats Card
function StatsCard({ pastEvents, upcomingEvents }: { pastEvents: BookedEvent[]; upcomingEvents: BookedEvent[] }) {
  // Calculate events this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const eventsThisMonth = pastEvents.filter(b =>
    b.activity.startTime && new Date(b.activity.startTime) >= startOfMonth
  ).length + upcomingEvents.filter(b =>
    b.activity.startTime && new Date(b.activity.startTime) >= startOfMonth
  ).length

  // Calculate current streak (consecutive weeks with events)
  const weekStreak = Math.min(Math.ceil(pastEvents.length / 2), 12) // Simplified streak calculation

  if (pastEvents.length === 0 && upcomingEvents.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{eventsThisMonth}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Events this month</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pastEvents.length}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Total attended</p>
      </div>
    </div>
  )
}

// Event Card Component
function EventCard({ booking, isPast = false }: { booking: BookedEvent; isPast?: boolean }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
      <Link
        href={`/e/${booking.activity.slug || booking.activity.id}`}
        className="flex"
      >
        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800 relative">
          {booking.activity.imageUrl ? (
            <Image
              src={booking.activity.imageUrl}
              alt={booking.activity.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-neutral-400" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              {booking.activity.type}
            </span>
            {isPast && (
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                Completed
              </span>
            )}
          </div>
          <h4 className="font-medium text-neutral-900 dark:text-white line-clamp-1 text-sm">
            {booking.activity.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {booking.activity.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateLabel(booking.activity.startTime)} • {formatTime(booking.activity.startTime)}
              </span>
            )}
          </div>
          {/* Host info */}
          {booking.activity.host && (
            <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
              <User className="w-3 h-3" />
              <span className="line-clamp-1">{booking.activity.host.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center pr-3">
          <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
        </div>
      </Link>

      {/* Quick Actions for upcoming events */}
      {!isPast && (
        <div className="flex border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => openDirections(booking.activity.latitude, booking.activity.longitude, booking.activity.city)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </button>
          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />
          <a
            href={generateCalendarUrl(booking, 'google')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Add to Cal
          </a>
        </div>
      )}
    </div>
  )
}

export default function SchedulePage() {
  const { isLoaded, isSignedIn } = useUser()
  const [bookedEvents, setBookedEvents] = useState<BookedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch booked events for signed in users
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isSignedIn) {
        setIsLoading(false)
        return
      }

      try {
        setError(null)
        const response = await fetch('/api/users/me/bookings')
        if (!response.ok) {
          throw new Error('Failed to fetch bookings')
        }
        const data = await response.json()
        setBookedEvents(data.bookings || [])
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to fetch bookings')
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      fetchBookings()
    }
  }, [isLoaded, isSignedIn])

  // Separate upcoming and past events
  const now = new Date()
  const upcomingEvents = bookedEvents
    .filter(b => b.status !== 'CANCELLED' && b.activity.startTime && new Date(b.activity.startTime) > now)
    .sort((a, b) => new Date(a.activity.startTime!).getTime() - new Date(b.activity.startTime!).getTime())

  const pastEvents = bookedEvents
    .filter(b => b.status !== 'CANCELLED' && b.activity.startTime && new Date(b.activity.startTime) <= now)
    .sort((a, b) => new Date(b.activity.startTime!).getTime() - new Date(a.activity.startTime!).getTime())

  const nextEvent = upcomingEvents[0]

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </Link>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">My Schedule</h1>
            </div>
          </div>
        </header>

        {/* Sign in prompt */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm mb-6">
              <CalendarDays className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">See your schedule</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xs mx-auto">
              Sign in to view your booked events and track your fitness journey.
            </p>
            <Link
              href="/sign-in?redirect_url=/saved"
              className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white px-6 py-3 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-white dark:text-neutral-900"
            >
              Sign in to continue
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up?redirect_url=/saved" className="text-neutral-900 dark:text-white font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">My Schedule</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {upcomingEvents.length} upcoming • {pastEvents.length} past
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 pb-24 px-4">
        {isLoading ? (
          <div className="space-y-4 mt-4">
            {/* Skeleton for next event */}
            <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-48" />
            {/* Skeleton for stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="animate-pulse bg-white dark:bg-neutral-900 rounded-xl h-24 border border-neutral-100 dark:border-neutral-800" />
              <div className="animate-pulse bg-white dark:bg-neutral-900 rounded-xl h-24 border border-neutral-100 dark:border-neutral-800" />
            </div>
            {/* Skeleton for events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((col) => (
                <div key={col} className="space-y-3">
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 h-24" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Failed to load schedule</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm mb-6">
              <CalendarDays className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No events yet</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Book an event to see it in your schedule.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white px-6 py-3 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-white dark:text-neutral-900"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            {/* Next Event Highlight */}
            {nextEvent && <NextEventCard booking={nextEvent} />}

            {/* Stats */}
            <StatsCard pastEvents={pastEvents} upcomingEvents={upcomingEvents} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Events Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-white dark:text-neutral-900" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">Upcoming</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{upcomingEvents.length} events</p>
                  </div>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 text-center">
                    <CalendarDays className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">No upcoming events</p>
                    <Link
                      href="/"
                      className="text-sm font-medium text-neutral-900 dark:text-white hover:underline"
                    >
                      Browse events →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Skip first event as it's shown in highlight */}
                    {upcomingEvents.slice(1).map((booking) => (
                      <EventCard key={booking.id} booking={booking} />
                    ))}
                    {upcomingEvents.length === 1 && (
                      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 text-center">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Your next event is shown above
                        </p>
                        <Link
                          href="/"
                          className="text-sm font-medium text-neutral-900 dark:text-white hover:underline mt-2 inline-block"
                        >
                          Book more events →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Past Events Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">Past Events</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{pastEvents.length} attended</p>
                  </div>
                </div>

                {pastEvents.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 text-center">
                    <History className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No past events yet</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      Your attended events will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastEvents.slice(0, 10).map((booking) => (
                      <EventCard key={booking.id} booking={booking} isPast />
                    ))}
                    {pastEvents.length > 10 && (
                      <Link
                        href="/my-bookings"
                        className="block text-center py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        View all {pastEvents.length} past events →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  )
}
