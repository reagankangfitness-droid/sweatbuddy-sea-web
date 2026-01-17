'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Heart, Calendar, MapPin, Trash2, Loader2, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { safeGetJSON, safeSetJSON, ensureArray } from '@/lib/safe-storage'

interface SavedEvent {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  imageUrl?: string | null
  recurring: boolean
  slug?: string | null
}

interface BookedEvent {
  id: string
  status: string
  createdAt: string
  activity: {
    id: string
    title: string
    type: string
    city: string
    startTime: string | null
    endTime: string | null
    imageUrl: string | null
  }
}

interface GroupedBookings {
  [date: string]: BookedEvent[]
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Wellness': '💆',
  'Strength': '💪',
  'Cycling': '🚴',
  'Dance': '💃',
  'Boxing': '🥊',
  'Bootcamp': '⚡',
}

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || '✨'
}

function formatDateHeader(dateStr: string): string {
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
    weekday: 'long',
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

function groupBookingsByDate(bookings: BookedEvent[]): GroupedBookings {
  const grouped: GroupedBookings = {}

  bookings
    .filter(b => b.status !== 'CANCELLED' && b.activity.startTime)
    .filter(b => new Date(b.activity.startTime!) > new Date())
    .sort((a, b) => {
      const dateA = new Date(a.activity.startTime!)
      const dateB = new Date(b.activity.startTime!)
      return dateA.getTime() - dateB.getTime()
    })
    .forEach(booking => {
      const dateKey = new Date(booking.activity.startTime!).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(booking)
    })

  return grouped
}

export default function SavedPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([])
  const [bookedEvents, setBookedEvents] = useState<BookedEvent[]>([])
  const [allEvents, setAllEvents] = useState<SavedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'schedule' | 'favorites'>('schedule')

  // Fetch all events and filter by saved IDs
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events')
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        const data = await response.json()
        setAllEvents(ensureArray<SavedEvent>(data?.events))
      } catch (error) {
        console.error('Error fetching events:', error)
        setAllEvents([])
      }
    }

    fetchEvents()
  }, [])

  // Fetch booked events for signed in users
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isSignedIn) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/users/me/bookings')
        if (response.ok) {
          const data = await response.json()
          setBookedEvents(data.bookings || [])
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      fetchBookings()
    }
  }, [isLoaded, isSignedIn])

  // Load saved events from localStorage
  useEffect(() => {
    if (allEvents.length === 0) return

    const savedIds = safeGetJSON<string[]>('sweatbuddies_saved', [])
    const saved = allEvents.filter((event: SavedEvent) => savedIds.includes(event.id))
    setSavedEvents(saved)
    if (!isSignedIn) {
      setIsLoading(false)
    }
  }, [allEvents, isSignedIn])

  // Listen for changes to saved events
  useEffect(() => {
    const handleSavedUpdate = () => {
      const savedIds = safeGetJSON<string[]>('sweatbuddies_saved', [])
      const saved = allEvents.filter((event: SavedEvent) => savedIds.includes(event.id))
      setSavedEvents(saved)
    }

    window.addEventListener('savedEventsUpdated', handleSavedUpdate)
    return () => window.removeEventListener('savedEventsUpdated', handleSavedUpdate)
  }, [allEvents])

  const handleRemove = (eventId: string) => {
    const savedIds = safeGetJSON<string[]>('sweatbuddies_saved', [])
    const newSavedIds = savedIds.filter((id: string) => id !== eventId)
    safeSetJSON('sweatbuddies_saved', newSavedIds)
    setSavedEvents(savedEvents.filter(e => e.id !== eventId))
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  const groupedBookings = groupBookingsByDate(bookedEvents)
  const upcomingCount = Object.values(groupedBookings).flat().length

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
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">My Events</h1>
            </div>
          </div>
        </header>

        {/* Sign in prompt */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-card mb-6">
              <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">See your schedule</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xs mx-auto">
              Sign in to view your booked events and track your fitness schedule.
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
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">My Events</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {upcomingCount} upcoming • {savedEvents.length} saved
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule ({upcomingCount})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                Saved ({savedEvents.length})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-36 pb-24 px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card p-4 flex gap-4">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-2" />
                  <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'schedule' ? (
          // Schedule View
          Object.keys(groupedBookings).length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-card mb-6">
                <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No upcoming events</h2>
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
            <div className="space-y-6">
              {Object.entries(groupedBookings).map(([dateKey, dayBookings]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-neutral-300 dark:text-neutral-600 uppercase">
                        {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-white dark:text-neutral-900 -mt-0.5">
                        {new Date(dateKey).getDate()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {formatDateHeader(dateKey)}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {dayBookings.length} event{dayBookings.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-3 ml-[60px]">
                    {dayBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/activities/${booking.activity.id}`}
                        className="block bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-card overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex">
                          {/* Time Column */}
                          <div className="w-20 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800/50 flex flex-col items-center justify-center py-4 border-r border-neutral-100 dark:border-neutral-800">
                            <Clock className="w-4 h-4 text-neutral-400 mb-1" />
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                              {booking.activity.startTime ? formatTime(booking.activity.startTime) : 'TBD'}
                            </span>
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 p-4 flex items-center gap-3">
                            {/* Image */}
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                              {booking.activity.imageUrl ? (
                                <Image
                                  src={booking.activity.imageUrl}
                                  alt={booking.activity.title}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-neutral-400" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                {booking.activity.type}
                              </span>
                              <h4 className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                                {booking.activity.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="line-clamp-1">{booking.activity.city}</span>
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* View All Bookings Link */}
              <div className="text-center pt-4">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  View all bookings & past events
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        ) : (
          // Favorites View
          savedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-card mb-6">
                <Heart className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No saved events yet</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Tap the heart icon on events you&apos;re interested in to save them here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white px-6 py-3 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-white dark:text-neutral-900"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.slug || event.id}`}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card flex gap-4 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-neutral-50 dark:bg-neutral-800 relative rounded-xl">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-sand to-mist">
                        {getCategoryEmoji(event.category)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                      {event.category}
                    </span>
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-1 mt-0.5">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{event.day} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                      <MapPin className="w-3 h-3 text-neutral-300 dark:text-neutral-500" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(event.id)
                    }}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </Link>
              ))}
            </div>
          )
        )}
      </main>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  )
}
