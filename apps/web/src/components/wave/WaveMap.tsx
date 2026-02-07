'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import { WAVE_ACTIVITIES, WAVE_POLL_INTERVAL } from '@/lib/wave/constants'
import { LIGHT_MAP_STYLES, DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { UnifiedFilterBar, ActivitySelectionSheet } from './UnifiedFilterBar'
import type { TimeFilter } from './UnifiedFilterBar'
import { WaveBubblePin } from './WaveBubblePin'
import type { WaveData } from './WaveBubblePin'
import { ActivityBubblePin } from './ActivityBubblePin'
import type { HostedActivityData } from './ActivityBubblePin'
import { WaveDetailSheet } from './WaveDetailSheet'
import { ActivityDetailSheet } from './ActivityDetailSheet'
import { CreateWaveSheet } from './CreateWaveSheet'
import { CrewChatView } from './CrewChatView'
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

export function WaveMap() {
  const { resolvedTheme } = useTheme()
  const { user: clerkUser } = useUser()
  const isDark = resolvedTheme === 'dark'

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const initialCenterSet = useRef(false)
  const [waves, setWaves] = useState<WaveData[]>([])
  const [hostedActivities, setHostedActivities] = useState<HostedActivityData[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [selectedWave, setSelectedWave] = useState<WaveData | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<HostedActivityData | null>(null)
  const [selectedWaveParticipant, setSelectedWaveParticipant] = useState(false)
  const [filters, setFilters] = useState<Set<WaveActivityType | 'ALL'>>(new Set(['ALL']))
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL')
  const [activitySheetOpen, setActivitySheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [crewChat, setCrewChat] = useState<{
    chatId: string; emoji: string; area: string;
    starterThought?: string | null; starterName?: string | null;
    starterImageUrl?: string | null; locationName?: string | null;
    scheduledFor?: string | null;
  } | null>(null)
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

  // Poll waves
  const fetchWaves = useCallback(async () => {
    if (!myPosition) return
    try {
      const typeParam = [...filters].find((f): f is WaveActivityType => f !== 'ALL')
      const url = `/api/wave?lat=${myPosition.lat}&lng=${myPosition.lng}${typeParam ? `&type=${typeParam}` : ''}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      if (data.waves) setWaves(data.waves)
      if (data.hostedActivities) setHostedActivities(data.hostedActivities)
      setHasFetched(true)
    } catch { /* silent */ }
  }, [myPosition, filters])

  useEffect(() => {
    fetchWaves()
    pollRef.current = setInterval(fetchWaves, WAVE_POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchWaves])

  // Filter toggle
  const handleFilterToggle = (key: WaveActivityType | 'ALL') => {
    setFilters((prev) => {
      if (key === 'ALL') return new Set(['ALL'])
      const next = new Set(prev)
      next.delete('ALL')
      if (next.has(key)) {
        next.delete(key)
        if (next.size === 0) return new Set(['ALL'])
      } else {
        // For map filtering, only allow one type at a time (since API takes single type)
        return new Set([key])
      }
      return next
    })
  }

  // Filtered waves (client-side for ALL mode)
  const filteredWaves = useMemo(() => {
    if (filters.has('ALL')) return waves
    return waves.filter((w) => filters.has(w.activityType))
  }, [waves, filters])

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

  // Delete wave handler
  const handleDeleteWave = async (waveId: string) => {
    const res = await fetch(`/api/wave/${waveId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    setSelectedWave(null)
    fetchWaves()
  }

  // Join handler
  const handleJoin = async (waveId: string) => {
    const res = await fetch(`/api/wave/${waveId}/join`, { method: 'POST' })
    if (!res.ok) throw new Error('Join failed')
    const data = await res.json()
    fetchWaves()
    return data as { isUnlocked: boolean; chatId: string | null }
  }

  // Create wave handler
  const handleCreateWave = async (data: {
    activityType: WaveActivityType
    area: string
    thought?: string
    locationName?: string
    latitude?: number
    longitude?: number
    scheduledFor?: string
  }) => {
    const res = await fetch('/api/wave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Create failed')
    }
    fetchWaves()
  }

  // Open chat
  const handleOpenChat = (chatId: string) => {
    const wave = selectedWave || waves.find((w) => w.chatId === chatId)
    setCrewChat({
      chatId,
      emoji: wave ? WAVE_ACTIVITIES[wave.activityType].emoji : '🏋️',
      area: wave?.area || '',
      starterThought: wave?.thought,
      starterName: wave?.creatorName,
      starterImageUrl: wave?.creatorImageUrl,
      locationName: wave?.locationName,
      scheduledFor: wave?.scheduledFor,
    })
  }

  // Select wave and check participation
  const handleSelectWave = async (wave: WaveData) => {
    setSelectedActivity(null)
    setSelectedWave(wave)
    try {
      const res = await fetch(`/api/wave/${wave.id}`)
      const data = await res.json()
      setSelectedWaveParticipant(data.wave?.isParticipant || false)
    } catch {
      setSelectedWaveParticipant(false)
    }
  }

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

        {/* Waves */}
        {filteredWaves.map((w) => (
          <WaveBubblePin
            key={w.id}
            wave={w}
            onClick={() => handleSelectWave(w)}
          />
        ))}

        {/* Events */}
        {filteredHosted.map((a) => (
          <ActivityBubblePin
            key={`hosted-${a.id}`}
            activity={a}
            onClick={() => { setSelectedWave(null); setSelectedActivity(a) }}
          />
        ))}
      </GoogleMap>

      {/* Filter bar */}
      <UnifiedFilterBar
        activityFilter={filters}
        timeFilter={timeFilter}
        onActivityToggle={handleFilterToggle}
        onTimeSelect={setTimeFilter}
        onOpenActivitySheet={() => setActivitySheetOpen(true)}
      />

      {/* Empty state - show when no waves AND no events */}
      {hasFetched && filteredWaves.length === 0 && filteredHosted.length === 0 && (
        <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl px-6 py-5 text-center shadow-lg max-w-xs">
            <p className="text-3xl mb-2">🌊</p>
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">No activity nearby</p>
            <p className="text-sm text-neutral-400 mt-1">
              Be the first! Start an activity and others can join you.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-3 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm pointer-events-auto"
            >
              Start activity 🙋
            </button>
          </div>
        </div>
      )}

      {/* Start activity FAB */}
      {!crewChat && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 inline-block -mt-0.5 mr-1" />
          Start activity
        </button>
      )}

      {/* Wave detail sheet */}
      <AnimatePresence>
        {selectedWave && (
          <WaveDetailSheet
            wave={selectedWave}
            onClose={() => setSelectedWave(null)}
            onJoin={handleJoin}
            onOpenChat={handleOpenChat}
            isParticipant={selectedWaveParticipant}
            currentUserId={clerkUser?.id}
            onDeleteWave={handleDeleteWave}
          />
        )}
      </AnimatePresence>

      {/* Hosted activity detail sheet */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailSheet
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </AnimatePresence>

      {/* Create wave sheet */}
      <CreateWaveSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateWave={handleCreateWave}
        userPosition={myPosition}
      />

      {/* Activity selection sheet */}
      <ActivitySelectionSheet
        isOpen={activitySheetOpen}
        onClose={() => setActivitySheetOpen(false)}
        activityFilter={filters}
        onSelect={(activity) => {
          handleFilterToggle(activity)
          setActivitySheetOpen(false)
        }}
      />

      {/* Crew chat overlay */}
      <AnimatePresence>
        {crewChat && clerkUser && (
          <CrewChatView
            chatId={crewChat.chatId}
            activityEmoji={crewChat.emoji}
            area={crewChat.area}
            currentUserId={clerkUser.id}
            onClose={() => setCrewChat(null)}
            starterThought={crewChat.starterThought}
            starterName={crewChat.starterName}
            starterImageUrl={crewChat.starterImageUrl}
            locationName={crewChat.locationName}
            scheduledFor={crewChat.scheduledFor}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
