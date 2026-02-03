'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronDown, Loader2, MapPin, Zap, Leaf, Flame } from 'lucide-react'
import { EventCardCompact } from './EventCardCompact'
import type { NeighborhoodEvent, NeighborhoodEventsResponse } from '@/types/neighborhood'

interface NeighborhoodDrawerProps {
  neighborhoodId: string | null
  timeRange: string
  onClose: () => void
}

export function NeighborhoodDrawer({
  neighborhoodId,
  timeRange,
  onClose,
}: NeighborhoodDrawerProps) {
  const [neighborhood, setNeighborhood] = useState<{
    id: string
    name: string
    vibe: 'chill' | 'moderate' | 'intense'
    description: string
  } | null>(null)
  const [events, setEvents] = useState<NeighborhoodEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch events when neighborhood changes
  useEffect(() => {
    if (!neighborhoodId) {
      setEvents([])
      setNeighborhood(null)
      setIsExpanded(false)
      return
    }

    async function fetchEvents() {
      setIsLoading(true)
      setEvents([])
      setCursor(null)

      try {
        const res = await fetch(
          `/api/map/neighborhoods/${neighborhoodId}/events?timeRange=${timeRange}&limit=10`
        )
        const data: NeighborhoodEventsResponse = await res.json()

        if (data.success) {
          setNeighborhood(data.data.neighborhood)
          setEvents(data.data.events)
          setHasMore(data.data.pagination.hasMore)
          setCursor(data.data.pagination.cursor)
        }
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [neighborhoodId, timeRange])

  // Load more events
  const loadMore = useCallback(async () => {
    if (!neighborhoodId || !cursor || isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/map/neighborhoods/${neighborhoodId}/events?timeRange=${timeRange}&limit=10&cursor=${cursor}`
      )
      const data: NeighborhoodEventsResponse = await res.json()

      if (data.success) {
        setEvents((prev) => [...prev, ...data.data.events])
        setHasMore(data.data.pagination.hasMore)
        setCursor(data.data.pagination.cursor)
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false)
    }
  }, [neighborhoodId, cursor, timeRange, isLoading])

  // Vibe icon
  const VibeIcon = neighborhood?.vibe === 'chill'
    ? Leaf
    : neighborhood?.vibe === 'intense'
    ? Flame
    : Zap

  const vibeColors = {
    chill: 'text-emerald-600 bg-emerald-50',
    moderate: 'text-amber-600 bg-amber-50',
    intense: 'text-rose-600 bg-rose-50',
  }

  if (!neighborhoodId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
          transition-all duration-300 ease-out
          ${isExpanded ? 'h-[85vh]' : 'max-h-[60vh]'}
        `}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-neutral-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {neighborhood ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-neutral-900">
                      {neighborhood.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        vibeColors[neighborhood.vibe]
                      }`}
                    >
                      <VibeIcon className="w-3 h-3" />
                      {neighborhood.vibe}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {neighborhood.description}
                  </p>
                </>
              ) : (
                <div className="animate-pulse">
                  <div className="h-6 w-32 bg-neutral-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-neutral-100 rounded" />
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Expand/collapse toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <span>{isExpanded ? 'Show less' : 'Show all events'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Events list */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ maxHeight: isExpanded ? 'calc(85vh - 160px)' : '300px' }}
        >
          {isLoading && events.length === 0 ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3 p-3 bg-neutral-50 rounded-2xl">
                  <div className="w-20 h-20 bg-neutral-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                    <div className="h-3 w-1/2 bg-neutral-100 rounded" />
                    <div className="h-3 w-1/3 bg-neutral-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}

              {/* Load more button */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more events'
                  )}
                </button>
              )}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                No events yet
              </h3>
              <p className="text-sm text-neutral-500">
                Check back soon or explore other neighborhoods
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
