'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { FeaturedEventsCarousel } from './FeaturedEventsCarousel'
import { EventListCard } from './EventListCard'
import type { Event } from '@/lib/events'

// Lazy load EventDetailSheet - only loaded when user taps an event
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

interface Props {
  events: Event[]
}

// Get current week date range string
function getWeekDateRange(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`
}

export function MobileEventsSection({ events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Featured events are first 5 with images
  const featuredEvents = useMemo(() => {
    return events.filter(e => e.imageUrl).slice(0, 5)
  }, [events])

  return (
    <div id="events-mobile" className="md:hidden pt-4 pb-4">
      {/* Featured Carousel */}
      <FeaturedEventsCarousel
        events={featuredEvents.length > 0 ? featuredEvents : events.slice(0, 5)}
        onSelect={setSelectedEvent}
      />

      {/* Divider */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-4 my-6" />

      {/* Section Header */}
      <div className="px-4 mb-4">
        <h2 className="font-sans text-xl font-bold text-neutral-900 dark:text-white">This Week</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{getWeekDateRange()}</p>
      </div>

      {/* Event List - No filters */}
      <div className="px-4 mt-4 space-y-3">
        {events.map((event) => (
          <EventListCard
            key={event.id}
            event={event}
            onSelect={setSelectedEvent}
          />
        ))}

        {events.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-4xl mb-2">🏃</p>
            <p className="font-medium">No events this week</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        )}
      </div>

      {/* More events prompt */}
      <div className="px-4 mt-6">
        <div className="bg-white dark:bg-neutral-900 p-4 text-center rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            More events added every Wednesday
          </p>
        </div>
      </div>

      {/* Event Detail Sheet - Lazy loaded */}
      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
