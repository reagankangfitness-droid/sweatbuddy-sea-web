'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { SmartActivityMap, ViewToggle, EventCardCompact } from '@/components/map'
import type { MapOverviewResponse, NeighborhoodEvent } from '@/types/neighborhood'

type TimeRange = 'today' | 'weekend' | 'week' | 'month'
type ViewMode = 'map' | 'list'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  weekend: 'This Weekend',
  week: 'This Week',
  month: 'This Month',
}

export function MapSection() {
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false)
  const [allEvents, setAllEvents] = useState<NeighborhoodEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [neighborhoods, setNeighborhoods] = useState<{ id: string; eventCount: number }[]>([])

  // Fetch neighborhoods for list view
  useEffect(() => {
    async function fetchNeighborhoods() {
      try {
        const res = await fetch(`/api/map/overview?timeRange=${timeRange}`)
        const data: MapOverviewResponse = await res.json()
        if (data.success) {
          setNeighborhoods(
            data.data.neighborhoods.map((n) => ({ id: n.id, eventCount: n.eventCount }))
          )
        }
      } catch {
        // Error handled silently
      }
    }
    fetchNeighborhoods()
  }, [timeRange])

  // Fetch all events for list view
  useEffect(() => {
    if (viewMode !== 'list' || neighborhoods.length === 0) return

    async function fetchAllEvents() {
      setIsLoadingEvents(true)
      try {
        const neighborhoodsWithEvents = neighborhoods.filter((n) => n.eventCount > 0)
        const eventPromises = neighborhoodsWithEvents.map((n) =>
          fetch(`/api/map/neighborhoods/${n.id}/events?timeRange=${timeRange}&limit=50`)
            .then((res) => res.json())
            .then((data) => (data.success ? data.data.events : []))
        )

        const eventArrays = await Promise.all(eventPromises)
        const events = eventArrays.flat()

        // Sort by datetime
        events.sort(
          (a: NeighborhoodEvent, b: NeighborhoodEvent) =>
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        )
        setAllEvents(events)
      } catch {
        // Error handled silently
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchAllEvents()
  }, [viewMode, neighborhoods, timeRange])

  return (
    <section className="px-4 py-6 bg-neutral-50 dark:bg-neutral-950">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Explore Experiences</h2>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimeRangePicker(!showTimeRangePicker)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-700 dark:text-neutral-300">
                {TIME_RANGE_LABELS[timeRange]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Dropdown */}
            {showTimeRangePicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTimeRangePicker(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[140px] z-50">
                  {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range)
                        setShowTimeRangePicker(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                        timeRange === range
                          ? 'font-semibold text-neutral-900 dark:text-white'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {TIME_RANGE_LABELS[range]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <SmartActivityMap timeRange={timeRange} />
      ) : (
        <div className="space-y-3">
          {isLoadingEvents ? (
            // Loading skeleton
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex gap-3 p-3 bg-white dark:bg-neutral-800 rounded-2xl"
                >
                  <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-600 rounded" />
                    <div className="h-3 w-1/3 bg-neutral-100 dark:bg-neutral-600 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : allEvents.length > 0 ? (
            allEvents.map((event) => <EventCardCompact key={event.id} event={event} />)
          ) : (
            <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl">
              <p className="text-neutral-500 dark:text-neutral-400">
                No experiences found for {TIME_RANGE_LABELS[timeRange].toLowerCase()}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
