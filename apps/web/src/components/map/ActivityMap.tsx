'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      } catch {
        // Error handled silently
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
      className="relative w-full rounded-3xl overflow-hidden"
      style={{ height: '520px' }}
    >
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-sky-50 to-teal-50" />

      {/* Animated gradient orbs for depth */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl"
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Water effects - South China Sea / Singapore Strait */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-200/60 via-blue-100/30 to-transparent" />
        {/* Subtle wave pattern */}
        <svg className="absolute bottom-0 left-0 right-0 h-16 opacity-30" viewBox="0 0 400 40" preserveAspectRatio="none">
          <motion.path
            d="M0,20 Q50,10 100,20 T200,20 T300,20 T400,20 V40 H0 Z"
            fill="url(#waveGradient)"
            animate={{
              d: [
                "M0,20 Q50,10 100,20 T200,20 T300,20 T400,20 V40 H0 Z",
                "M0,20 Q50,30 100,20 T200,20 T300,20 T400,20 V40 H0 Z",
                "M0,20 Q50,10 100,20 T200,20 T300,20 T400,20 V40 H0 Z",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Johor Strait (north) */}
      <div className="absolute top-0 left-1/4 right-1/4 h-12 bg-gradient-to-b from-blue-200/40 to-transparent" />

      {/* Singapore silhouette - stylized shape */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M80,180
             Q90,160 120,155
             Q140,150 160,145
             Q180,140 200,135
             Q220,130 240,135
             Q280,145 300,150
             Q320,155 340,165
             Q350,175 345,185
             Q340,195 320,200
             Q300,205 280,210
             Q260,215 240,215
             Q220,215 200,210
             Q180,205 160,200
             Q140,195 120,190
             Q100,185 80,180 Z"
          fill="#64748b"
        />
        {/* Sentosa */}
        <ellipse cx="160" cy="230" rx="25" ry="10" fill="#64748b" />
      </svg>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Singapore label */}
      <motion.div
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-sm border border-white/50 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-base">🇸🇬</span>
        <span className="text-sm font-semibold text-gray-700">Singapore</span>
      </motion.div>

      {/* Legend - show on larger screens */}
      <motion.div
        className="absolute top-4 right-4 hidden sm:flex flex-col gap-1.5 bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-sm border border-white/50 z-20"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Events</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
          <span className="text-[10px] text-gray-600">6+ Hot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
          <span className="text-[10px] text-gray-600">5+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
          <span className="text-[10px] text-gray-600">3-4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-400 to-purple-500" />
          <span className="text-[10px] text-gray-600">1-2</span>
        </div>
      </motion.div>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-3 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-gray-500 font-medium">Loading events...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Neighborhood pins */}
      {!isLoading && (
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
      )}

      {/* Summary bar - only show when no selection */}
      <AnimatePresence>
        {!selectedNeighborhood && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <MapSummaryBar
              totalEvents={summary.totalEvents}
              totalAttendees={summary.totalAttendees}
              hotSpot={summary.hotSpot}
              onHotSpotClick={handleNeighborhoodSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Neighborhood drawer */}
      <NeighborhoodDrawer
        neighborhoodId={selectedNeighborhood}
        timeRange={timeRange}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
