'use client'

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventCard } from './EventCard'
import { CategoryBar, categoryMapping } from './CategoryBar'

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
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
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
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter events based on selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events
    const categoryValues = categoryMapping[selectedCategory] || []
    if (categoryValues.length === 0) return events
    return events.filter(event =>
      categoryValues.some(cat =>
        event.category.toLowerCase().includes(cat.toLowerCase())
      )
    )
  }, [events, selectedCategory])

  // Shared event handling
  const [sharedEvent, setSharedEvent] = useState<Event | null>(null)
  const [isSharedSheetOpen, setIsSharedSheetOpen] = useState(false)

  const handleSharedEventFound = useCallback((event: Event) => {
    setSharedEvent(event)
    setIsSharedSheetOpen(true)
  }, [])

  return (
    <section id="events" className="relative py-20 md:py-32 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Shared Event Handler - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <SharedEventHandler events={events} onEventFound={handleSharedEventFound} />
      </Suspense>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white mb-2">
            This week in Singapore
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            {getCurrentWeekRange()}
          </p>
        </div>

        {/* Category Filter Bar */}
        <div className="mb-8">
          <CategoryBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : selectedCategory !== 'all' ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl max-w-md mx-auto">
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-lg">No {selectedCategory} events this week</h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto px-4 mb-4">
              Check back soon or explore other categories.
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-neutral-900 dark:text-white font-medium hover:underline"
            >
              View all events
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl max-w-md mx-auto">
            <span className="text-5xl mb-4 block">🏃</span>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-lg">Nothing here yet</h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto px-4">
              Be the first to host something this week.
            </p>
          </div>
        )}

        {/* Simple CTA */}
        <div className="text-center mt-12">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            New events added weekly
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
