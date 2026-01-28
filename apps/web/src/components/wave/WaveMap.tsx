'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import { WAVE_ACTIVITIES, WAVE_POLL_INTERVAL } from '@/lib/wave/constants'
import { LIGHT_MAP_STYLES, DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { WaveFilterBar } from './WaveFilterBar'
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

  // Map hosted activity categorySlug/type to wave filter types
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

  // Filtered hosted activities
  const filteredHosted = useMemo(() => {
    if (filters.has('ALL')) return hostedActivities
    return hostedActivities.filter((a) => {
      const slug = (a.categorySlug || '').toLowerCase()
      const type = (a.type || '').toLowerCase()
      const mapped = HOSTED_TO_WAVE[slug] || HOSTED_TO_WAVE[type]
      if (mapped) return filters.has(mapped)
      // If filter is ANYTHING, show unmatched activities too
      return filters.has('ANYTHING' as WaveActivityType)
    })
  }, [hostedActivities, filters])

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

  // Prevent body scroll so map gets all touch events
  useEffect(() => {
    const prev = document.body.style.cssText
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    return () => { document.body.style.cssText = prev }
  }, [])

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
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="relative -ml-3 -mt-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 border-[3px] border-white shadow-lg" />
              <div className="absolute inset-0 w-6 h-6 rounded-full bg-blue-500 animate-ping opacity-30" />
            </div>
          </OverlayView>
        )}

        {filteredWaves.map((w) => (
          <WaveBubblePin
            key={w.id}
            wave={w}
            onClick={() => handleSelectWave(w)}
          />
        ))}

        {filteredHosted.map((a) => (
          <ActivityBubblePin
            key={`hosted-${a.id}`}
            activity={a}
            onClick={() => { setSelectedWave(null); setSelectedActivity(a) }}
          />
        ))}
      </GoogleMap>

      {/* Filter bar */}
      <WaveFilterBar selected={filters} onToggle={handleFilterToggle} />

      {/* Empty state */}
      {hasFetched && filteredWaves.length === 0 && filteredHosted.length === 0 && (
        <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl px-6 py-5 text-center shadow-lg max-w-xs">
            <p className="text-3xl mb-2">🌊</p>
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">No activities forming nearby</p>
            <p className="text-sm text-neutral-400 mt-1">
              Be the first! Start an activity and others can wave to join.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-3 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm pointer-events-auto"
            >
              Start an activity 🙋
            </button>
          </div>
        </div>
      )}

      {/* Bottom drawer with activity cards */}
      {!selectedWave && !selectedActivity && !crewChat && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl px-4 pt-4 pb-20 max-h-[50dvh] overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">{filteredWaves.length} activities forming</h3>
              <p className="text-sm text-neutral-500">Wave to join a crew</p>
            </div>
          </div>

          {/* Horizontal scroll of activity cards */}
          {filteredWaves.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 mb-3 scrollbar-hide">
              {filteredWaves.map((w) => {
                const info = WAVE_ACTIVITIES[w.activityType]
                return (
                  <button
                    key={w.id}
                    onClick={() => handleSelectWave(w)}
                    className={`flex-shrink-0 w-64 rounded-xl p-3 transition-colors text-left ${
                      w.isUnlocked ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white text-sm">{info.label}</p>
                        <p className="text-xs text-neutral-500 truncate">📍 {w.locationName || w.area}</p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {w.isUnlocked ? '✅' : `${w.participantCount}/${w.waveThreshold} 🙋`}
                      </span>
                    </div>
                    {w.thought && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">&ldquo;{w.thought}&rdquo;</p>
                    )}
                    {w.scheduledFor && (
                      <p className="text-xs text-neutral-400 mt-1">📅 {new Date(w.scheduledFor).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Start new activity CTA */}
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm"
          >
            Start an activity 🙋
          </button>
        </div>
      )}

      {/* Create wave FAB (visible when drawer hidden) */}
      {(selectedWave || selectedActivity || crewChat) && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-24 right-4 z-10 w-14 h-14 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
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
