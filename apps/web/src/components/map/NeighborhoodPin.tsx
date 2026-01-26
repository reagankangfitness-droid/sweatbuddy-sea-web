'use client'

import { motion } from 'framer-motion'
import type { NeighborhoodOverview } from '@/types/neighborhood'

interface NeighborhoodPinProps {
  neighborhood: NeighborhoodOverview
  isSelected: boolean
  onSelect: (id: string) => void
}

// Get color based on event count
function getPinColor(count: number, isHot: boolean): { bg: string; text: string; ring: string; glow: string } {
  if (isHot) {
    return {
      bg: 'bg-gradient-to-br from-orange-400 to-red-500',
      text: 'text-white',
      ring: 'ring-orange-300/50',
      glow: 'shadow-orange-400/40',
    }
  }
  if (count >= 5) {
    return {
      bg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      text: 'text-white',
      ring: 'ring-emerald-300/50',
      glow: 'shadow-emerald-400/30',
    }
  }
  if (count >= 3) {
    return {
      bg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      text: 'text-white',
      ring: 'ring-blue-300/50',
      glow: 'shadow-blue-400/30',
    }
  }
  if (count >= 1) {
    return {
      bg: 'bg-gradient-to-br from-violet-400 to-purple-500',
      text: 'text-white',
      ring: 'ring-violet-300/50',
      glow: 'shadow-violet-400/30',
    }
  }
  return {
    bg: 'bg-white/60',
    text: 'text-gray-400',
    ring: 'ring-gray-200/50',
    glow: 'shadow-none',
  }
}

export function NeighborhoodPin({ neighborhood, isSelected, onSelect }: NeighborhoodPinProps) {
  const hasEvents = neighborhood.eventCount > 0
  const isHot = neighborhood.isHot
  const colors = getPinColor(neighborhood.eventCount, isHot)

  return (
    <motion.button
      onClick={() => onSelect(neighborhood.id)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
      style={{
        top: neighborhood.mapPosition.top,
        left: neighborhood.mapPosition.left,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: Math.random() * 0.3 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulse ring for hot neighborhoods */}
      {isHot && (
        <motion.div
          className="absolute inset-0 rounded-full bg-orange-400/30"
          style={{ width: '52px', height: '52px', marginLeft: '-6px', marginTop: '-6px' }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Pin circle */}
      <motion.div
        className={`
          relative flex items-center justify-center rounded-full transition-all duration-300
          ${hasEvents ? 'w-10 h-10' : 'w-8 h-8'}
          ${isSelected
            ? 'bg-black text-white ring-4 ring-white/30 shadow-2xl'
            : `${colors.bg} ${colors.text} ring-2 ${colors.ring} shadow-lg ${colors.glow}`
          }
        `}
        animate={isSelected ? { scale: 1.2 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Hot fire icon */}
        {isHot && !isSelected && (
          <motion.span
            className="absolute -top-1.5 -right-1.5 text-sm drop-shadow-md"
            animate={{
              y: [0, -2, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔥
          </motion.span>
        )}

        <span className={`font-bold ${hasEvents ? 'text-sm' : 'text-xs'}`}>
          {neighborhood.eventCount}
        </span>
      </motion.div>

      {/* Label */}
      <motion.span
        className={`
          mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap backdrop-blur-sm
          ${isSelected
            ? 'bg-black text-white shadow-lg'
            : hasEvents
              ? 'bg-white/95 text-gray-700 shadow-md'
              : 'bg-white/70 text-gray-400 shadow-sm'
          }
        `}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {neighborhood.shortName}
      </motion.span>
    </motion.button>
  )
}
