'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, MapPin, Users, Clock, Calendar, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'
import { MyCommunities } from '@/components/community/MyCommunities'

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
  participantCount?: number
  isEventSubmission?: boolean
  friendsGoing?: { id: string; name: string | null; firstName: string | null; imageUrl: string | null }[]
  familiarFaces?: { name: string | null; firstName: string | null; imageUrl: string | null; sharedEventCount: number }[]
}

function getEventUrl(event: HostedEvent): string {
  if (event.isEventSubmission || event.id.startsWith('event_')) {
    return `/e/${event.id.replace('event_', '')}`
  }
  return `/activities/${event.id}`
}

const SG_TZ = { timeZone: 'Asia/Singapore' } as const

function formatEventTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...SG_TZ })
  const dateSG = date.toLocaleDateString('en-US', SG_TZ)
  const nowSG = now.toLocaleDateString('en-US', SG_TZ)
  const tomorrowSG = tomorrow.toLocaleDateString('en-US', SG_TZ)

  if (dateSG === nowSG) return `Today, ${timeStr}`
  if (dateSG === tomorrowSG) return `Tomorrow, ${timeStr}`
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...SG_TZ }) + `, ${timeStr}`
}

function formatHeroTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...SG_TZ })
}

type TimeGroup = 'today' | 'tomorrow' | 'this_weekend' | 'this_week' | 'coming_up'

function getTimeGroup(event: HostedEvent): TimeGroup {
  if (event.isHappeningToday) return 'today'

  const now = new Date()
  const eventDate = new Date(event.startTime)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const eventDateSG = eventDate.toLocaleDateString('en-US', SG_TZ)
  const tomorrowSG = tomorrow.toLocaleDateString('en-US', SG_TZ)

  if (eventDateSG === tomorrowSG) return 'tomorrow'
  if (event.isThisWeekend) return 'this_weekend'

  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  if (eventDate <= weekFromNow) return 'this_week'

  return 'coming_up'
}

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Happening Today',
  tomorrow: 'Tomorrow',
  this_weekend: 'This Weekend',
  this_week: 'This Week',
  coming_up: 'Coming Up',
}

const TIME_GROUP_ORDER: TimeGroup[] = ['today', 'tomorrow', 'this_weekend', 'this_week', 'coming_up']

export default function EventsPage() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<HostedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get('cat'))
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const fetchEvents = useCallback(async () => {
    try {
      const waveRes = await fetch('/api/wave?lat=1.3521&lng=103.8198')
      if (waveRes.ok) {
        const data = await waveRes.json()
        if (data.hostedActivities) {
          setEvents(data.hostedActivities)
        }
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

  // Filter out past events
  const activeEvents = useMemo(() => {
    const bufferTime = new Date(Date.now() - 3 * 60 * 60 * 1000)
    return events.filter((event) => {
      if (!event.startTime) return event.recurring
      return new Date(event.startTime) >= bufferTime
    })
  }, [events])

  // Get unique categories present in events for filter pills
  const availableCategories = useMemo(() => {
    const slugs = new Set(activeEvents.map((e) => e.categorySlug).filter(Boolean))
    return ACTIVITY_CATEGORIES.filter((c) => slugs.has(c.slug)).sort((a, b) => a.displayOrder - b.displayOrder)
  }, [activeEvents])

  // Apply category filter
  const filteredEvents = useMemo(() => {
    if (!categoryFilter) return activeEvents
    return activeEvents.filter((e) => e.categorySlug === categoryFilter)
  }, [activeEvents, categoryFilter])

  // Group events by time
  const groupedEvents = useMemo(() => {
    const groups = new Map<TimeGroup, HostedEvent[]>()
    for (const event of filteredEvents) {
      const group = getTimeGroup(event)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push(event)
    }
    // Sort events within each group by startTime
    for (const [, events] of groups) {
      events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    }
    return groups
  }, [filteredEvents])

  // Popular Right Now: top 4 events by RSVP count within next 14 days
  const popularEvents = useMemo(() => {
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    return [...activeEvents]
      .filter((e) => {
        if (!e.startTime) return e.recurring
        return new Date(e.startTime) <= fourteenDaysFromNow
      })
      .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
      .slice(0, 4)
  }, [activeEvents])

  // Friends Are Going: events where followed users RSVP'd, max 4
  const friendsGoingEvents = useMemo(() => {
    return activeEvents
      .filter((e) => e.friendsGoing && e.friendsGoing.length > 0)
      .slice(0, 4)
  }, [activeEvents])

  // Today's events for hero card
  const todayEvents = groupedEvents.get('today') || []
  const heroEvent = todayEvents[0]

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-neutral-100">Events</h1>
              <Link
                href="/host"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-900 rounded-full text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Host
              </Link>
            </div>

            {/* Category filter pills - horizontal scroll */}
            {availableCategories.length > 0 && (
              <div className="relative -mx-4">
                <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10" />
              <div
                ref={categoryScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1"
              >
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === null
                      ? 'bg-white text-neutral-900'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  All
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === cat.slug
                        ? 'bg-white text-neutral-900'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pt-4 pb-24 md:pb-12">
        {/* My Communities — only shown for signed-in users with follows */}
        <MyCommunities />

        {loading ? (
          /* Loading skeleton - card grid */
          <div className="space-y-6">
            <div className="h-48 bg-neutral-700 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-neutral-700 rounded-2xl" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-4 bg-neutral-700 rounded w-3/4" />
                    <div className="h-3 bg-neutral-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-100 font-semibold mb-1">
              {categoryFilter ? 'No events in this category' : 'No events found'}
            </p>
            <p className="text-neutral-500 text-sm max-w-xs mb-6">
              {categoryFilter
                ? 'Try a different category or check back later.'
                : 'No upcoming events nearby. Start the movement!'}
            </p>
            <Link
              href="/host"
              className="flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full font-semibold"
            >
              <Plus className="w-4 h-4" />
              Host an event
            </Link>
          </div>
        ) : (
          <div>
            {/* ── PRIMARY: Happening This Week ── */}

            {/* Hero card for today's featured event */}
            {heroEvent && !categoryFilter && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link
                  href={getEventUrl(heroEvent)}
                  className="block relative rounded-2xl overflow-hidden group"
                >
                  <div className="aspect-[16/9] relative">
                    {heroEvent.imageUrl ? (
                      <Image
                        src={heroEvent.imageUrl}
                        alt={heroEvent.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                        <span className="text-6xl">{heroEvent.emoji}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Live badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-500 rounded-full">
                      <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full animate-pulse" />
                      <span className="text-white text-xs font-bold uppercase tracking-wide">Today</span>
                    </div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="text-xl font-bold text-white mb-1">{heroEvent.title}</h2>
                      <div className="flex items-center gap-3 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatHeroTime(heroEvent.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {heroEvent.locationName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {heroEvent.hostImageUrl ? (
                            <Image
                              src={heroEvent.hostImageUrl}
                              alt={heroEvent.hostName}
                              width={24}
                              height={24}
                              className="rounded-full border-2 border-white/30"
                              unoptimized
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white/30" />
                          )}
                          <span className="text-white/90 text-sm font-medium">{heroEvent.hostName}</span>
                        </div>
                        {heroEvent.spotsLeft !== null && (
                          <span className={`text-sm font-medium ${heroEvent.spotsLeft <= 3 ? 'text-orange-300' : 'text-white/70'}`}>
                            {heroEvent.spotsLeft} spots left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Additional today events as full-width list on mobile */}
                {todayEvents.length > 1 && (
                  <div className="flex flex-col gap-3 mt-3 md:grid md:grid-cols-3 md:gap-4">
                    {todayEvents.slice(1).map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Grouped event sections */}
            {TIME_GROUP_ORDER.map((groupKey) => {
              const groupEvents = groupedEvents.get(groupKey)
              if (!groupEvents || groupEvents.length === 0) return null
              // Skip "today" if we already showed the hero card
              if (groupKey === 'today' && heroEvent && !categoryFilter) return null

              return (
                <section key={groupKey} className="py-6 md:py-12 first:pt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-neutral-100">
                  <h2 className="text-lg font-bold text-neutral-100 mb-4">
                    {TIME_GROUP_LABELS[groupKey]}
                  </h2>
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
                    {groupEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* ── Discovery Sections (only when not filtering by category) ── */}
            {!categoryFilter && (
              <>
                {/* ── SECONDARY: Popular Right Now ── */}
                {popularEvents.length > 0 && (
                  <section className="py-6 md:py-12 border-t border-neutral-800">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <h2 className="text-base font-semibold text-neutral-100">Popular Right Now</h2>
                    </div>
                    <div className="relative -mx-4 md:mx-0">
                      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10 md:hidden" />
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 md:px-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
                        {popularEvents.map((event, index) => (
                          <div key={event.id} className="flex-shrink-0 w-[70vw] md:w-auto">
                            <EventCard event={event} index={index} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* ── CONTEXTUAL: Friends Are Going ── */}
                {friendsGoingEvents.length > 0 && (
                  <section className="py-6 md:py-12 border-t border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <h2 className="text-base font-semibold text-neutral-100">Friends Are Going</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {friendsGoingEvents.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} compact />
                      ))}
                    </div>
                  </section>
                )}

              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function EventCard({ event, index, compact }: { event: HostedEvent; index: number; compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={getEventUrl(event)}
        className="block bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-600 hover:shadow-lg transition-all group"
      >
        {/* Image */}
        <div className={`relative overflow-hidden ${compact ? 'aspect-[3/2]' : 'aspect-[4/3]'}`}>
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
              <span className="text-4xl">{event.emoji}</span>
            </div>
          )}

          {/* Host avatar overlapping bottom of image */}
          <div className="absolute -bottom-3 left-3">
            {event.hostImageUrl ? (
              <Image
                src={event.hostImageUrl}
                alt={event.hostName}
                width={28}
                height={28}
                className="rounded-full border-2 border-neutral-700 shadow-sm"
                unoptimized
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-300 border-2 border-neutral-700 shadow-sm" />
            )}
          </div>

          {/* Spots badge */}
          {event.spotsLeft !== null && event.spotsLeft <= 5 && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
              <span className={`text-xs font-bold ${event.spotsLeft <= 3 ? 'text-orange-300' : 'text-white'}`}>
                {event.spotsLeft} left
              </span>
            </div>
          )}

          {/* Today badge */}
          {event.isHappeningToday && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 rounded-full">
              <span className="text-white text-xs font-bold">TODAY</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pt-4">
          <h3 className="font-semibold text-sm text-neutral-100 line-clamp-2 leading-tight">
            {event.title}
          </h3>

          <div className="flex items-center gap-1 mt-1.5 text-sm text-neutral-500">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{formatEventTime(event.startTime)}</span>
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-sm text-neutral-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.locationName}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-neutral-400 truncate">
              by {event.hostName}
            </span>
          </div>

          {event.friendsGoing && event.friendsGoing.length > 0 ? (
            <div className="flex items-center gap-1 mt-1.5">
              <Users className="w-3 h-3 flex-shrink-0 text-indigo-500" />
              <span className="text-xs text-indigo-600 truncate">
                {event.friendsGoing.length === 1 ? (
                  <><strong>{event.friendsGoing[0].firstName || event.friendsGoing[0].name}</strong> is going</>
                ) : event.friendsGoing.length === 2 ? (
                  <><strong>{event.friendsGoing[0].firstName || event.friendsGoing[0].name}</strong> and <strong>{event.friendsGoing[1].firstName || event.friendsGoing[1].name}</strong> are going</>
                ) : (
                  <><strong>{event.friendsGoing[0].firstName || event.friendsGoing[0].name}</strong> and <strong>{event.friendsGoing.length - 1} others</strong> you follow are going</>
                )}
              </span>
            </div>
          ) : event.familiarFaces && event.familiarFaces.length > 0 ? (
            <div className="flex items-center gap-1 mt-1.5">
              <Users className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              <span className="text-xs text-emerald-500 truncate">
                {event.familiarFaces.length === 1 ? (
                  <><strong>{event.familiarFaces[0].firstName || event.familiarFaces[0].name}</strong> worked out with you before</>
                ) : event.familiarFaces.length === 2 ? (
                  <><strong>{event.familiarFaces[0].firstName || event.familiarFaces[0].name}</strong> and <strong>{event.familiarFaces[1].firstName || event.familiarFaces[1].name}</strong> you know are going</>
                ) : (
                  <><strong>{event.familiarFaces[0].firstName || event.familiarFaces[0].name}</strong> + <strong>{event.familiarFaces.length - 1} others</strong> you know are going</>
                )}
              </span>
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  )
}

