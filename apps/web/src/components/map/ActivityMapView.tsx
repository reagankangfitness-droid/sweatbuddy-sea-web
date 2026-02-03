'use client'

import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, List, Map } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { EventMapMarker, ClusterMarker } from './EventMapMarker'
import type { MapEvent } from './EventMapMarker'

const EventDetailSheet = lazy(() =>
  import('@/components/EventDetailSheet').then((m) => ({ default: m.EventDetailSheet }))
)

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }

// Cluster radius in degrees (~200m at Singapore's latitude)
const CLUSTER_RADIUS = 0.002

const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#ecfdf5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fef3c7' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
]

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#16213e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3a2a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d3d5c' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3b82f6' }] },
]

interface Cluster {
  id: string
  events: MapEvent[]
  center: google.maps.LatLngLiteral
}

function clusterEvents(events: MapEvent[]): Cluster[] {
  const used = new Set<number>()
  const clusters: Cluster[] = []

  for (let i = 0; i < events.length; i++) {
    if (used.has(i)) continue
    used.add(i)

    const cluster: MapEvent[] = [events[i]]
    const centerLat = events[i].latitude
    const centerLng = events[i].longitude

    for (let j = i + 1; j < events.length; j++) {
      if (used.has(j)) continue
      const dLat = Math.abs(events[j].latitude - centerLat)
      const dLng = Math.abs(events[j].longitude - centerLng)
      if (dLat < CLUSTER_RADIUS && dLng < CLUSTER_RADIUS) {
        cluster.push(events[j])
        used.add(j)
      }
    }

    const avgLat = cluster.reduce((s, e) => s + e.latitude, 0) / cluster.length
    const avgLng = cluster.reduce((s, e) => s + e.longitude, 0) / cluster.length

    clusters.push({
      id: cluster.map((e) => e.id).join('-'),
      events: cluster,
      center: { lat: avgLat, lng: avgLng },
    })
  }

  return clusters
}

type TimeRange = 'today' | 'weekend' | 'week' | 'month'

interface ActivityMapViewProps {
  timeRange?: TimeRange
  onToggleView?: () => void
}

export function ActivityMapView({ timeRange = 'month', onToggleView }: ActivityMapViewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [events, setEvents] = useState<MapEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null)
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const mapStyles = useMemo(() => (isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES), [isDark])

  useEffect(() => {
    if (map) map.setOptions({ styles: mapStyles })
  }, [map, mapStyles])

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/map/events?timeRange=${timeRange}`)
        const data = await res.json()
        if (data.success) {
          setEvents(data.data.events)
        }
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [timeRange])

  const clusters = useMemo(() => clusterEvents(events), [events])

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  const handleMarkerClick = useCallback((event: MapEvent) => {
    setSelectedEvent(event)
  }, [])

  const handleClusterClick = useCallback(
    (cluster: Cluster) => {
      if (map) {
        map.panTo(cluster.center)
        const currentZoom = map.getZoom() || 12
        map.setZoom(Math.min(currentZoom + 2, 18))
      }
    },
    [map]
  )

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        if (map) {
          map.panTo(loc)
          map.setZoom(15)
        }
      },
      () => {
        // Geolocation denied or unavailable
      }
    )
  }, [map])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full h-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
        <div className="text-center p-6">
          <MapPin className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-neutral-400 font-medium">Google Maps not configured</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="relative w-full h-full h-full flex items-center justify-center bg-red-50 dark:bg-neutral-900">
        <p className="text-red-500 dark:text-red-400">Failed to load Google Maps</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
        <motion.div
          className="w-12 h-12 border-3 border-gray-200 dark:border-neutral-700 border-t-pink-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={SINGAPORE_CENTER}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: mapStyles,
          minZoom: 11,
          maxZoom: 18,
          restriction: {
            latLngBounds: { north: 1.5, south: 1.15, east: 104.1, west: 103.6 },
            strictBounds: true,
          },
        }}
      >
        {/* Event markers and clusters */}
        {clusters.map((cluster) =>
          cluster.events.length === 1 ? (
            <EventMapMarker
              key={cluster.id}
              event={cluster.events[0]}
              onClick={handleMarkerClick}
            />
          ) : (
            <ClusterMarker
              key={cluster.id}
              count={cluster.events.length}
              position={cluster.center}
              onClick={() => handleClusterClick(cluster)}
            />
          )
        )}

        {/* User location blue dot */}
        {userLocation && (
          <OverlayView
            position={userLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -8, y: -8 })}
          >
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg">
              <div className="w-full h-full rounded-full bg-blue-500 animate-ping opacity-40" />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Events count pill (top center) */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700/50">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {isLoading ? 'Loading...' : `${events.length} Events Nearby`}
          </span>
        </div>
      </motion.div>

      {/* List/Map toggle (bottom center) */}
      {onToggleView && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={onToggleView}
            className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full px-5 py-3 shadow-xl font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </motion.div>
      )}

      {/* Locate me button (bottom right) */}
      <motion.div
        className="absolute bottom-6 right-4 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          onClick={handleLocateMe}
          className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-transform hover:scale-105 active:scale-95"
          aria-label="Locate me"
        >
          <Navigation className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        </button>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/70 backdrop-blur-sm z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-3 border-gray-200 dark:border-neutral-700 border-t-pink-500 rounded-full mx-auto mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-gray-500 dark:text-neutral-300 font-medium">Loading events...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event detail sheet */}
      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={{
              id: selectedEvent.id,
              slug: selectedEvent.slug,
              name: selectedEvent.name,
              category: selectedEvent.category,
              day: selectedEvent.day,
              eventDate: selectedEvent.eventDate,
              time: selectedEvent.time,
              location: selectedEvent.location,
              description: selectedEvent.description,
              organizer: selectedEvent.organizer,
              imageUrl: selectedEvent.imageUrl,
              recurring: selectedEvent.recurring,
              goingCount: selectedEvent.goingCount,
              isFull: selectedEvent.isFull,
              isFree: selectedEvent.isFree,
              price: selectedEvent.price,
            }}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
