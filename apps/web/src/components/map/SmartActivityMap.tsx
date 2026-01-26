'use client'

import dynamic from 'next/dynamic'
import { ActivityMap } from './ActivityMap'

// Dynamically import GoogleActivityMap to avoid SSR issues with Google Maps
const GoogleActivityMap = dynamic(
  () => import('./GoogleActivityMap').then(mod => mod.GoogleActivityMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-neutral-900 animate-pulse" style={{ height: '520px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-gray-200 dark:border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    ),
  }
)

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

type TimeRange = 'today' | 'weekend' | 'week' | 'month'

interface SmartActivityMapProps {
  timeRange?: TimeRange
  onNeighborhoodSelect?: (id: string | null) => void
  preferGoogleMaps?: boolean
}

/**
 * Smart wrapper that uses Google Maps when available, falls back to SVG map
 */
export function SmartActivityMap({
  timeRange = 'week',
  onNeighborhoodSelect,
  preferGoogleMaps = true,
}: SmartActivityMapProps) {
  // Use Google Maps if API key is available and preferred
  const useGoogleMaps = preferGoogleMaps && !!GOOGLE_MAPS_API_KEY

  if (useGoogleMaps) {
    return (
      <GoogleActivityMap
        timeRange={timeRange}
        onNeighborhoodSelect={onNeighborhoodSelect}
      />
    )
  }

  // Fallback to SVG-based map
  return (
    <ActivityMap
      timeRange={timeRange}
      onNeighborhoodSelect={onNeighborhoodSelect}
    />
  )
}
