'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, MapPin, Calendar, Users, Clock, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface HostedEvent {
  id: string
  title: string
  categorySlug: string
  type: string
  emoji: string
  hostName: string
  hostImageUrl?: string
  locationName: string
  latitude: number
  longitude: number
  startTime: string
  spotsLeft: number | null
  totalSpots: number | null
  price: number
  currency: string
  imageUrl?: string
  isHappeningToday: boolean
  isThisWeekend: boolean
  recurring: boolean
  isEventSubmission?: boolean
}

// Helper to get the correct event detail URL
function getEventUrl(event: HostedEvent): string {
  // EventSubmissions have IDs like "event_xxx" and link to /e/xxx
  if (event.isEventSubmission || event.id.startsWith('event_')) {
    return `/e/${event.id.replace('event_', '')}`
  }
  // Activities link to /activities/xxx
  return `/activities/${event.id}`
}

type FilterTab = 'all' | 'today' | 'week'

function formatEventTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // All events are in Singapore timezone
  const sgOptions = { timeZone: 'Asia/Singapore' } as const
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...sgOptions })

  // Compare dates in Singapore timezone
  const dateSG = date.toLocaleDateString('en-US', sgOptions)
  const nowSG = now.toLocaleDateString('en-US', sgOptions)
  const tomorrowSG = tomorrow.toLocaleDateString('en-US', sgOptions)

  if (dateSG === nowSG) {
    return `Today, ${timeStr}`
  }
  if (dateSG === tomorrowSG) {
    return `Tomorrow, ${timeStr}`
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...sgOptions }) + `, ${timeStr}`
}

export default function EventsPage() {
  const [events, setEvents] = useState<HostedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  const fetchEvents = useCallback(async () => {
    try {
      // Use the wave API which returns hosted activities
      const res = await fetch('/api/wave?lat=1.3521&lng=103.8198')
      if (!res.ok) {
        console.error('Failed to fetch events:', res.status)
        return
      }
      const data = await res.json()
      if (data.hostedActivities) {
        setEvents(data.hostedActivities)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Filter events based on selected tab
  const filteredEvents = events.filter((event) => {
    const now = new Date()
    // 3 hour buffer - events still shown up to 3 hours after start
    const bufferTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    // First, exclude past events
    if (event.startTime) {
      const eventDate = new Date(event.startTime)
      if (eventDate < bufferTime) return false
    }

    // Then apply tab filter
    if (filter === 'today') return event.isHappeningToday
    if (filter === 'week') {
      if (!event.startTime) return event.recurring // Show recurring
      const eventDate = new Date(event.startTime)
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return eventDate <= weekFromNow
    }
    return true
  })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Experiences</h1>
              <Link
                href="/host"
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Host experience
              </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This week' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as FilterTab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 pb-28">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-900 dark:text-white font-semibold mb-1">No experiences found</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mb-6">
              {filter === 'today'
                ? "No experiences happening today. Check back later or host your own!"
                : filter === 'week'
                ? "No experiences this week. Be the first to host one!"
                : "No upcoming experiences nearby. Start the movement!"}
            </p>
            <Link
              href="/host"
              className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold"
            >
              <Plus className="w-4 h-4" />
              Host an experience
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={getEventUrl(event)}
                  className="block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex p-4 gap-4">
                    {/* Event image or emoji */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {event.emoji}
                        </div>
                      )}
                      {event.isHappeningToday && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                          TODAY
                        </div>
                      )}
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="truncate">{formatEventTime(event.startTime)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{event.locationName}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {event.hostImageUrl ? (
                            <Image
                              src={event.hostImageUrl}
                              alt={event.hostName}
                              width={20}
                              height={20}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                          )}
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {event.hostName}
                          </span>
                        </div>

                        {event.spotsLeft !== null && (
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            <span className={event.spotsLeft <= 3 ? 'text-orange-500 font-medium' : 'text-neutral-500'}>
                              {event.spotsLeft} spots left
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 self-center" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
