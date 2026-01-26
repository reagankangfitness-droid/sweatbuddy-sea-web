'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { NeighborhoodPin } from './NeighborhoodPin'
import { NeighborhoodDrawer } from './NeighborhoodDrawer'
import { MapSummaryBar } from './MapSummaryBar'
import type { NeighborhoodOverview, MapOverviewResponse } from '@/types/neighborhood'

type TimeRange = 'today' | 'weekend' | 'week' | 'month'

interface ActivityMapProps {
  timeRange?: TimeRange
  onNeighborhoodSelect?: (id: string | null) => void
}

export function ActivityMap({ timeRange = 'week', onNeighborhoodSelect }: ActivityMapProps) {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOverview[]>([])
  const [summary, setSummary] = useState<{
    totalEvents: number
    totalAttendees: number
    hotSpot: { id: string; name: string } | null
  }>({ totalEvents: 0, totalAttendees: 0, hotSpot: null })
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch map overview
  useEffect(() => {
    async function fetchOverview() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/map/overview?timeRange=${timeRange}`)
        const data: MapOverviewResponse = await res.json()

        if (data.success) {
          setNeighborhoods(data.data.neighborhoods)
          setSummary(data.data.summary)
        }
      } catch (error) {
        console.error('Failed to fetch map overview:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverview()
  }, [timeRange])

  const handleNeighborhoodSelect = (id: string) => {
    const newSelection = id === selectedNeighborhood ? null : id
    setSelectedNeighborhood(newSelection)
    onNeighborhoodSelect?.(newSelection)
  }

  const handleCloseDrawer = () => {
    setSelectedNeighborhood(null)
    onNeighborhoodSelect?.(null)
  }

  return (
    <div
      className="relative w-full rounded-3xl border border-gray-200 overflow-hidden"
      style={{ height: '550px' }}
    >
      {/* Gradient background per spec */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-teal-50/50 to-emerald-50" />

      {/* Singapore map background */}
      <div className="absolute inset-0 opacity-40">
        <Image
          src="/images/singapore-map.svg"
          alt="Singapore Map"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Water decoration blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl" />

      {/* Loading state */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Neighborhood pins */}
          <div className="absolute inset-0">
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodPin
                key={neighborhood.id}
                neighborhood={neighborhood}
                isSelected={selectedNeighborhood === neighborhood.id}
                onSelect={handleNeighborhoodSelect}
              />
            ))}
          </div>

          {/* Summary bar - only show when no selection */}
          {!selectedNeighborhood && (
            <MapSummaryBar
              totalEvents={summary.totalEvents}
              totalAttendees={summary.totalAttendees}
              hotSpot={summary.hotSpot}
              onHotSpotClick={handleNeighborhoodSelect}
            />
          )}
        </>
      )}

      {/* Neighborhood drawer */}
      <NeighborhoodDrawer
        neighborhoodId={selectedNeighborhood}
        timeRange={timeRange}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
