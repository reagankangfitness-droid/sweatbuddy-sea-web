'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { LIGHT_MAP_STYLES, DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import type { TimeFilter } from './UnifiedFilterBar'
import { ActivityBubblePin } from './ActivityBubblePin'
import type { HostedActivityData } from './ActivityBubblePin'
import { ActivityDetailSheet } from './ActivityDetailSheet'
import type { WaveActivityType } from '@prisma/client'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }
const LIBRARIES: ('places')[] = ['places']
const BLUE_DOT_OFFSET = { x: -12, y: -12 }
const blueDotOffset = () => BLUE_DOT_OFFSET

const HOSTED_TO_WAVE: Record<string, WaveActivityType> = {
  running: 'RUN', run: 'RUN',
  yoga: 'YOGA',
  gym: 'GYM', 'weight-training': 'GYM', strength: 'GYM',
  cycling: 'CYCLE', 'road-cycling': 'CYCLE', cycle: 'CYCLE',
  swim: 'SWIM', swimming: 'SWIM',
  hike: 'HIKE', hiking: 'HIKE',
  tennis: 'TENNIS',
  pickleball: 'PICKLEBALL',
  basketball: 'BASKETBALL',
  badminton: 'BADMINTON',
  football: 'FOOTBALL', soccer: 'FOOTBALL',
  climb: 'CLIMB', climbing: 'CLIMB',
  boxing: 'BOXING',
  hyrox: 'HYROX', hiit: 'HYROX',
  dance: 'DANCE',
  pilates: 'PILATES',
  walk: 'WALK', walking: 'WALK',
}

const POLL_INTERVAL = 30_000

export function WaveMap() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const initialCenterSet = useRef(false)
  const [hostedActivities, setHostedActivities] = useState<HostedActivityData[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<HostedActivityData | null>(null)
  const [filters, setFilters] = useState<Set<WaveActivityType | 'ALL'>>(new Set(['ALL']))
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: LIBRARIES })

  const mapStyles = useMemo(() => (isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES), [isDark])

  useEffect(() => {
    if (map) map.setOptions({ styles: mapStyles })
  }, [map, mapStyles])

  // Center map once when position is first available
  useEffect(() => {
    if (map && myPosition && !initialCenterSet.current) {
      map.panTo(myPosition)
      initialCenterSet.current = true
    }
  }, [map, myPosition])

  // Geolocation — run once on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setMyPosition(DEFAULT_CENTER)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMyPosition(loc)
      },
      () => setMyPosition(DEFAULT_CENTER),
      { enableHighAccuracy: true }
    )
  }, [])

  // Fetch experiences
  const fetchExperiences = useCallback(async () => {
    if (!myPosition) return
    try {
      const url = `/api/wave?lat=${myPosition.lat}&lng=${myPosition.lng}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      if (data.hostedActivities) setHostedActivities(data.hostedActivities)
      setHasFetched(true)
    } catch { /* silent */ }
  }, [myPosition])

  useEffect(() => {
    fetchExperiences()
    pollRef.current = setInterval(fetchExperiences, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchExperiences])

  // Filtered hosted activities (by activity type + time)
  const filteredHosted = useMemo(() => {
    const now = new Date()
    // 3 hour buffer - events are still shown up to 3 hours after start time
    const bufferTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    // First, filter out past events (events that have ended or started more than 3 hours ago)
    let result = hostedActivities.filter((a) => {
      // Recurring events with no specific date are always shown
      if (a.recurring && !a.startTime) return true
      // If has end time, check it hasn't passed
      if (a.endTime) {
        return new Date(a.endTime) >= now
      }
      // If has start time but no end time, use 3 hour buffer
      if (a.startTime) {
        return new Date(a.startTime) >= bufferTime
      }
      // No time info - show it (shouldn't happen with proper data)
      return true
    })

    // Apply activity type filter
    if (!filters.has('ALL')) {
      result = result.filter((a) => {
        const slug = (a.categorySlug || '').toLowerCase()
        const type = (a.type || '').toLowerCase()
        const mapped = HOSTED_TO_WAVE[slug] || HOSTED_TO_WAVE[type]
        if (mapped) return filters.has(mapped)
        // If filter is ANYTHING, show unmatched activities too
        return filters.has('ANYTHING' as WaveActivityType)
      })
    }

    // Apply time filter
    if (timeFilter === 'TODAY') {
      result = result.filter((a) => a.isHappeningToday)
    } else if (timeFilter === 'TOMORROW') {
      result = result.filter((a) => {
        if (!a.startTime) return false
        const eventDate = new Date(a.startTime)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return eventDate.toDateString() === tomorrow.toDateString()
      })
    } else if (timeFilter === 'WEEKEND') {
      result = result.filter((a) => a.isThisWeekend)
    } else if (timeFilter === 'WEEK') {
      // Show events within the next 7 days
      result = result.filter((a) => {
        if (!a.startTime) return a.recurring // Show recurring events
        const eventDate = new Date(a.startTime)
        const weekFromNow = new Date()
        weekFromNow.setDate(now.getDate() + 7)
        return eventDate >= bufferTime && eventDate <= weekFromNow
      })
    }

    return result
  }, [hostedActivities, filters, timeFilter])

  const onMapLoad = useCallback((m: google.maps.Map) => setMap(m), [])

  // Prevent body scroll so map gets all touch events
  useEffect(() => {
    const prev = document.body.style.cssText
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    return () => { document.body.style.cssText = prev }
  }, [])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-400">Google Maps API key not configured</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div
          className="w-10 h-10 border-3 border-neutral-200 dark:border-neutral-700 border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-full" style={{ touchAction: 'pan-x pan-y' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={DEFAULT_CENTER}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: mapStyles,
          clickableIcons: false,
          gestureHandling: 'greedy',
        }}
      >
        {/* User blue dot */}
        {myPosition && (
          <OverlayView
            position={myPosition}
            mapPaneName={OverlayView.OVERLAY_LAYER}
            getPixelPositionOffset={blueDotOffset}
          >
            <div className="relative" style={{ willChange: 'transform' }}>
              <div className="w-6 h-6 rounded-full bg-blue-500 border-[3px] border-white shadow-lg" />
              <div className="absolute -inset-1.5 rounded-full bg-blue-500/20" />
            </div>
          </OverlayView>
        )}

        {/* Experience pins */}
        {filteredHosted.map((a) => (
          <ActivityBubblePin
            key={`hosted-${a.id}`}
            activity={a}
            onClick={() => { setSelectedActivity(a) }}
          />
        ))}
      </GoogleMap>

      {/* Time filter chips */}
      <div className="absolute top-4 left-0 right-0 z-40 px-3">
        <div className="flex items-center gap-2">
          {[
            { key: 'TODAY' as TimeFilter, label: 'Today' },
            { key: 'WEEKEND' as TimeFilter, label: 'Weekend' },
            { key: 'WEEK' as TimeFilter, label: 'This Week' },
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setTimeFilter(timeFilter === chip.key ? 'ALL' : chip.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                timeFilter === chip.key
                  ? 'bg-white dark:bg-white text-neutral-900 border-white shadow-lg'
                  : 'bg-neutral-900/80 dark:bg-neutral-800/90 backdrop-blur-md text-neutral-300 border-neutral-700/50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {hasFetched && filteredHosted.length === 0 && (
        <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl px-6 py-5 text-center shadow-lg max-w-xs">
            <p className="text-3xl mb-2">📍</p>
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">No experiences nearby yet</p>
            <p className="text-sm text-neutral-400 mt-1">
              Check back soon for new experiences!
            </p>
          </div>
        </div>
      )}

      {/* Hosted activity detail sheet */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailSheet
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
