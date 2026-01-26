'use client'

import type { NeighborhoodOverview } from '@/types/neighborhood'

interface NeighborhoodPinProps {
  neighborhood: NeighborhoodOverview
  isSelected: boolean
  onSelect: (id: string) => void
}

export function NeighborhoodPin({ neighborhood, isSelected, onSelect }: NeighborhoodPinProps) {
  const hasEvents = neighborhood.eventCount > 0
  const isHot = neighborhood.isHot

  return (
    <button
      onClick={() => onSelect(neighborhood.id)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group"
      style={{
        top: neighborhood.mapPosition.top,
        left: neighborhood.mapPosition.left,
      }}
    >
      {/* Pin circle */}
      <div
        className={`
          relative flex items-center justify-center w-11 h-11 rounded-full shadow-lg transition-all duration-200
          ${isSelected
            ? 'bg-black text-white scale-110 shadow-xl'
            : hasEvents
              ? 'bg-white text-gray-900 group-hover:scale-110 group-hover:shadow-xl border-2 border-white'
              : 'bg-gray-200 text-gray-400 border-2 border-gray-100'
          }
        `}
      >
        {isHot && (
          <span className="absolute -top-1 -right-1 text-xs">🔥</span>
        )}
        <span className="font-bold">{neighborhood.eventCount}</span>
      </div>

      {/* Label */}
      <span
        className={`
          mt-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-all
          ${isSelected
            ? 'bg-black text-white'
            : 'bg-white/90 text-gray-600 shadow-sm'
          }
        `}
      >
        {neighborhood.shortName}
      </span>
    </button>
  )
}
