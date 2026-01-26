'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { MapPin, Clock, Users, Flame, ChevronRight, Calendar } from 'lucide-react'
import { NeighborhoodDrawer } from './NeighborhoodDrawer'
import type { NeighborhoodOverview, MapOverviewResponse } from '@/types/neighborhood'
import neighborhoodsData from '@/data/neighborhoods.json'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Singapore center
const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }

// Custom map styles - dark mode
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8b8b8b' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#16213e' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a5f' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a3a2a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3d3d5c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#252538' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3b82f6' }],
  },
]

// Color based on event count
function getMarkerColor(count: number, isHot: boolean): string {
  if (isHot) return '#f97316' // orange
  if (count >= 5) return '#10b981' // emerald
  if (count >= 3) return '#6366f1' // indigo
  if (count >= 1) return '#8b5cf6' // violet
  return '#d1d5db' // gray
}

// Create custom marker SVG
function createMarkerIcon(count: number, isHot: boolean, isSelected: boolean): string {
  const color = isSelected ? '#000000' : getMarkerColor(count, isHot)
  const size = count > 0 ? 40 : 32
  const textColor = count > 0 || isSelected ? '#ffffff' : '#6b7280'

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.2"/>
        </filter>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
      <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${count}</text>
      ${isHot ? `<text x="${size - 4}" y="12" font-size="12">🔥</text>` : ''}
    </svg>
  `)}`
}

type TimeRange = 'today' | 'weekend' | 'week' | 'month'

interface GoogleActivityMapProps {
  timeRange?: TimeRange
  onNeighborhoodSelect?: (id: string | null) => void
}

export function GoogleActivityMap({ timeRange = 'week', onNeighborhoodSelect }: GoogleActivityMapProps) {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOverview[]>([])
  const [summary, setSummary] = useState<{
    totalEvents: number
    totalAttendees: number
    hotSpot: { id: string; name: string } | null
  }>({ totalEvents: 0, totalAttendees: 0, hotSpot: null })
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

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

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  const handleMarkerClick = useCallback((id: string) => {
    const newSelection = id === selectedNeighborhood ? null : id
    setSelectedNeighborhood(newSelection)
    onNeighborhoodSelect?.(newSelection)

    // Pan to neighborhood
    if (newSelection && map) {
      const neighborhood = neighborhoodsData.neighborhoods.find(n => n.id === newSelection)
      if (neighborhood) {
        map.panTo({ lat: neighborhood.coordinates.lat, lng: neighborhood.coordinates.lng })
        map.setZoom(13)
      }
    }
  }, [selectedNeighborhood, onNeighborhoodSelect, map])

  const handleCloseDrawer = useCallback(() => {
    setSelectedNeighborhood(null)
    onNeighborhoodSelect?.(null)
    if (map) {
      map.panTo(SINGAPORE_CENTER)
      map.setZoom(12)
    }
  }, [onNeighborhoodSelect, map])

  // Merge neighborhood data with API stats
  const neighborhoodsWithStats = useMemo(() => {
    return neighborhoodsData.neighborhoods.map(n => {
      const stats = neighborhoods.find(stat => stat.id === n.id)
      return {
        ...n,
        eventCount: stats?.eventCount || 0,
        attendeeCount: stats?.attendeeCount || 0,
        isHot: stats?.isHot || false,
        nextEvent: stats?.nextEvent,
      }
    })
  }, [neighborhoods])

  // No API key - show fallback
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden bg-neutral-900" style={{ height: '520px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 font-medium mb-2">Google Maps not configured</p>
            <p className="text-sm text-neutral-500">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable</p>
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden bg-neutral-900" style={{ height: '520px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-400">Failed to load Google Maps</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden bg-neutral-900" style={{ height: '520px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 border-3 border-neutral-700 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-lg" style={{ height: '520px' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={SINGAPORE_CENTER}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: MAP_STYLES,
          minZoom: 11,
          maxZoom: 16,
          restriction: {
            latLngBounds: {
              north: 1.5,
              south: 1.15,
              east: 104.1,
              west: 103.6,
            },
            strictBounds: true,
          },
        }}
      >
        {/* Neighborhood markers */}
        {neighborhoodsWithStats.map((neighborhood) => (
          <Marker
            key={neighborhood.id}
            position={{ lat: neighborhood.coordinates.lat, lng: neighborhood.coordinates.lng }}
            onClick={() => handleMarkerClick(neighborhood.id)}
            onMouseOver={() => setHoveredNeighborhood(neighborhood.id)}
            onMouseOut={() => setHoveredNeighborhood(null)}
            icon={{
              url: createMarkerIcon(
                neighborhood.eventCount,
                neighborhood.isHot,
                selectedNeighborhood === neighborhood.id
              ),
              scaledSize: new google.maps.Size(
                neighborhood.eventCount > 0 ? 40 : 32,
                neighborhood.eventCount > 0 ? 50 : 42
              ),
              anchor: new google.maps.Point(
                neighborhood.eventCount > 0 ? 20 : 16,
                neighborhood.eventCount > 0 ? 20 : 16
              ),
            }}
            label={{
              text: neighborhood.shortName,
              className: `marker-label ${selectedNeighborhood === neighborhood.id ? 'selected' : ''}`,
              color: selectedNeighborhood === neighborhood.id ? '#000' : '#374151',
              fontSize: '11px',
              fontWeight: '600',
            }}
          />
        ))}

        {/* Highlight circle for selected neighborhood */}
        {selectedNeighborhood && (
          <Circle
            center={
              neighborhoodsWithStats.find(n => n.id === selectedNeighborhood)?.coordinates || SINGAPORE_CENTER
            }
            radius={1500}
            options={{
              fillColor: '#60a5fa',
              fillOpacity: 0.15,
              strokeColor: '#60a5fa',
              strokeOpacity: 0.5,
              strokeWeight: 2,
            }}
          />
        )}

        {/* Hover info window */}
        {hoveredNeighborhood && !selectedNeighborhood && (
          <InfoWindow
            position={
              neighborhoodsWithStats.find(n => n.id === hoveredNeighborhood)?.coordinates || SINGAPORE_CENTER
            }
            options={{
              pixelOffset: new google.maps.Size(0, -30),
              disableAutoPan: true,
            }}
            onCloseClick={() => setHoveredNeighborhood(null)}
          >
            <div className="p-3 min-w-[160px] bg-neutral-900 text-white rounded-xl">
              {(() => {
                const n = neighborhoodsWithStats.find(n => n.id === hoveredNeighborhood)
                if (!n) return null
                return (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-white">{n.name}</span>
                      {n.isHot && <span className="text-sm">🔥</span>}
                    </div>
                    <p className="text-xs text-neutral-400 mb-2">{n.description}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        <strong className="text-white">{n.eventCount}</strong> events
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-400" />
                        <strong className="text-white">{n.attendeeCount}</strong> going
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Singapore label */}
      <motion.div
        className="absolute top-4 left-4 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-neutral-700/50 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="text-base">🇸🇬</span>
        <span className="text-sm font-semibold text-white">Singapore</span>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="absolute top-4 right-4 hidden sm:flex flex-col gap-1.5 bg-neutral-900/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-neutral-700/50 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Events</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-[10px] text-neutral-300">6+ Hot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-neutral-300">5+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-[10px] text-neutral-300">3-4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-[10px] text-neutral-300">1-2</span>
        </div>
      </motion.div>

      {/* Summary bar */}
      <AnimatePresence>
        {!selectedNeighborhood && !isLoading && (
          <motion.div
            className="absolute bottom-4 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-700/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{summary.totalEvents}</p>
                      <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">Events</p>
                    </div>
                  </div>

                  <div className="w-px h-10 bg-neutral-700" />

                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{summary.totalAttendees}</p>
                      <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">Going</p>
                    </div>
                  </div>
                </div>

                {summary.hotSpot && (
                  <button
                    onClick={() => handleMarkerClick(summary.hotSpot!.id)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 rounded-xl transition-all border border-orange-500/30 group"
                  >
                    <Flame className="w-5 h-5 text-orange-400" fill="currentColor" />
                    <div className="text-left">
                      <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wide">Hot spot</p>
                      <p className="text-sm font-bold text-white">{summary.hotSpot.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 backdrop-blur-sm z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-3 border-neutral-700 border-t-blue-500 rounded-full mx-auto mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-neutral-300 font-medium">Loading events...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Neighborhood drawer */}
      <NeighborhoodDrawer
        neighborhoodId={selectedNeighborhood}
        timeRange={timeRange}
        onClose={handleCloseDrawer}
      />

      {/* Custom styles for marker labels */}
      <style jsx global>{`
        .marker-label {
          background: rgba(23, 23, 23, 0.9) !important;
          color: #e5e5e5 !important;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          white-space: nowrap;
          border: 1px solid rgba(64, 64, 64, 0.5);
        }
        .marker-label.selected {
          background: white !important;
          color: black !important;
          border-color: white;
        }
        .gm-style-iw {
          padding: 0 !important;
          background: #171717 !important;
          border-radius: 12px !important;
        }
        .gm-style-iw-d {
          overflow: hidden !important;
        }
        .gm-style-iw-c {
          background: #171717 !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .gm-style-iw-t::after {
          background: #171717 !important;
        }
        .gm-style-iw button[title="Close"] {
          display: none !important;
        }
        .gm-style .gm-style-iw-tc::after {
          background: #171717 !important;
        }
      `}</style>
    </div>
  )
}
