'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { GoogleMap, useLoadScript } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { ACTIVITIES, NEARBY_POLL_INTERVAL } from '@/lib/im-down/constants'
import { LIGHT_MAP_STYLES, DARK_MAP_STYLES } from '@/lib/im-down/map-styles'
import { StatusPicker } from './StatusPicker'
import { UserMapPin } from './UserMapPin'
import type { NearbyUser } from './UserMapPin'
import { PersonCard } from './PersonCard'
import type { ImDownActivity } from '@prisma/client'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 } // Singapore

interface MyStatus {
  activityType: ImDownActivity
  statusText?: string | null
  expiresAt: string
}

export function MapHome() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [myStatus, setMyStatus] = useState<MyStatus | null>(null)
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY })

  const mapStyles = useMemo(() => (isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES), [isDark])

  // Update map styles when theme changes
  useEffect(() => {
    if (map) map.setOptions({ styles: mapStyles })
  }, [map, mapStyles])

  // Get geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMyPosition(loc)
        if (map) map.panTo(loc)
      },
      () => {
        // Fallback to default
        setMyPosition(DEFAULT_CENTER)
      },
      { enableHighAccuracy: true }
    )
  }, [map])

  // Fetch my current status
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setMyStatus(d.status)
      })
      .catch(() => {})
  }, [])

  // Poll nearby users
  const fetchNearby = useCallback(async () => {
    if (!myPosition) return
    try {
      const res = await fetch(
        `/api/status/nearby?latitude=${myPosition.lat}&longitude=${myPosition.lng}`
      )
      const data = await res.json()
      if (data.nearby) setNearbyUsers(data.nearby)
    } catch {
      // Silently fail
    }
  }, [myPosition])

  useEffect(() => {
    fetchNearby()
    pollRef.current = setInterval(fetchNearby, NEARBY_POLL_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchNearby])

  // Set status handler
  const handleStatusSet = async (activityType: ImDownActivity, statusText?: string) => {
    if (!myPosition) return
    const res = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType,
        statusText,
        latitude: myPosition.lat,
        longitude: myPosition.lng,
      }),
    })
    const data = await res.json()
    if (data.status) {
      setMyStatus(data.status)
      fetchNearby()
    }
  }

  // Clear status
  const handleClearStatus = async () => {
    await fetch('/api/status', { method: 'DELETE' })
    setMyStatus(null)
  }

  // Match handler
  const handleMatch = async (recipientId: string, activityType: string) => {
    const res = await fetch('/api/buddy/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, activityType }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Match failed')
    }
  }

  // Filter nearby users based on my status activity
  const filteredUsers = useMemo(() => {
    if (!myStatus) return nearbyUsers
    if (myStatus.activityType === 'ANYTHING') return nearbyUsers
    return nearbyUsers.filter(
      (u) => u.activityType === myStatus.activityType || u.activityType === 'ANYTHING'
    )
  }, [nearbyUsers, myStatus])

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

  return (
    <div className="relative h-[100dvh] w-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={myPosition || DEFAULT_CENTER}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: mapStyles,
          clickableIcons: false,
        }}
      >
        {/* My blue dot */}
        {myPosition && (
          <div>
            {/* Rendered via OverlayView internally, but we use a circle marker for simplicity */}
          </div>
        )}

        {/* Nearby user pins */}
        {filteredUsers.map((u) => (
          <UserMapPin
            key={u.id}
            user={u}
            onClick={() => setSelectedUser(u)}
          />
        ))}
      </GoogleMap>

      {/* Active status pill */}
      <AnimatePresence>
        {myStatus && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-full pl-4 pr-2 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span className="text-lg">{ACTIVITIES[myStatus.activityType].emoji}</span>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {ACTIVITIES[myStatus.activityType].label}
            </span>
            <button
              onClick={handleClearStatus}
              className="ml-1 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — "I'm Down" */}
      {!myStatus && (
        <motion.button
          onClick={() => setPickerOpen(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-bold text-lg shadow-xl shadow-neutral-900/30 dark:shadow-white/20"
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          I&apos;m Down
        </motion.button>
      )}

      {/* Status picker */}
      <StatusPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onStatusSet={handleStatusSet}
      />

      {/* Person card */}
      <PersonCard
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onMatch={handleMatch}
      />
    </div>
  )
}
