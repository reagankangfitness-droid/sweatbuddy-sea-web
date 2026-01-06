'use client'

import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventCard } from './EventCard'

// Lazy load the detail sheet for shared events
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

// Separate component for shared event handling (needs useSearchParams)
function SharedEventHandler({ events, onEventFound }: { events: Event[], onEventFound: (event: Event) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const eventId = searchParams.get('event')
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId)
      if (event) {
        onEventFound(event)
        // Scroll to events section
        const eventsSection = document.getElementById('events')
        if (eventsSection) {
          setTimeout(() => {
            eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }
    }
  }, [searchParams, events, onEventFound])

  return null
}

interface Event {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null
  time: string
  location: string
  description: string | null
  organizer: string
  imageUrl: string | null
  communityLink?: string | null
  recurring: boolean
  goingCount?: number
  isFull?: boolean
  isFree?: boolean
  price?: number | null
}

interface EventsProps {
  initialEvents?: Event[]
}

function getCurrentWeekRange() {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`
}

export function Events({ initialEvents = [] }: EventsProps) {
  const [events] = useState<Event[]>(initialEvents)

  // Shared event handling
  const [sharedEvent, setSharedEvent] = useState<Event | null>(null)
  const [isSharedSheetOpen, setIsSharedSheetOpen] = useState(false)

  const handleSharedEventFound = useCallback((event: Event) => {
    setSharedEvent(event)
    setIsSharedSheetOpen(true)
  }, [])

  return (
    <section id="events" className="relative py-20 md:py-32 overflow-hidden bg-neutral-50">
      {/* Shared Event Handler - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <SharedEventHandler events={events} onEventFound={handleSharedEventFound} />
      </Suspense>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header - Simple */}
        <div className="text-center mb-12">
          <h2 className="font-bold text-3xl md:text-4xl text-neutral-900 mb-2">
            This Week
          </h2>
          <p className="text-neutral-500">
            {getCurrentWeekRange()}
          </p>
        </div>

        {/* Events Grid - No filters, just events */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl max-w-md mx-auto">
            <span className="text-5xl mb-4 block">🏃</span>
            <h3 className="font-semibold text-neutral-900 mb-2 text-lg">No events this week</h3>
            <p className="text-neutral-500 max-w-sm mx-auto px-4">
              Check back soon—new events drop every Wednesday.
            </p>
          </div>
        )}

        {/* Simple CTA */}
        <div className="text-center mt-12">
          <p className="text-neutral-500 text-sm">
            More events added every Wednesday
          </p>
        </div>
      </div>

      {/* Shared Event Detail Sheet */}
      {sharedEvent && isSharedSheetOpen && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={sharedEvent}
            isOpen={isSharedSheetOpen}
            onClose={() => {
              setIsSharedSheetOpen(false)
              // Clear the URL parameter without reload
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.delete('event')
                window.history.replaceState({}, '', url.toString())
              }
            }}
          />
        </Suspense>
      )}
    </section>
  )
}
