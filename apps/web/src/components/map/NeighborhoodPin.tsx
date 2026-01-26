'use client'

import { Flame, Calendar } from 'lucide-react'
import type { NeighborhoodOverview } from '@/types/neighborhood'

interface NeighborhoodPinProps {
  neighborhood: NeighborhoodOverview
  isSelected: boolean
  onSelect: (id: string) => void
}

export function NeighborhoodPin({ neighborhood, isSelected, onSelect }: NeighborhoodPinProps) {
  const hasEvents = neighborhood.eventCount > 0
  const isHot = neighborhood.isHot

  // Vibe colors
  const vibeColors = {
    chill: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    intense: 'bg-rose-500',
  }

  const vibeRingColors = {
    chill: 'ring-emerald-200',
    moderate: 'ring-amber-200',
    intense: 'ring-rose-200',
  }

  return (
    <button
      onClick={() => onSelect(neighborhood.id)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{
        top: neighborhood.mapPosition.top,
        left: neighborhood.mapPosition.left,
      }}
    >
      {/* Pin container */}
      <div
        className={`relative transition-all duration-200 ${
          isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
        }`}
      >
        {/* Hot indicator pulse ring */}
        {isHot && (
          <div className="absolute inset-0 -m-2">
            <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-30" />
          </div>
        )}

        {/* Main pin */}
        <div
          className={`
            relative flex items-center justify-center rounded-full shadow-lg border-2 transition-all
            ${hasEvents
              ? isSelected
                ? `${vibeColors[neighborhood.vibe]} border-white ring-4 ${vibeRingColors[neighborhood.vibe]}`
                : `${vibeColors[neighborhood.vibe]} border-white hover:ring-2 ${vibeRingColors[neighborhood.vibe]}`
              : 'bg-neutral-300 border-neutral-200'
            }
            ${hasEvents ? 'w-10 h-10' : 'w-8 h-8'}
          `}
        >
          {/* Event count or icon */}
          {hasEvents ? (
            <span className="text-white font-bold text-sm">
              {neighborhood.eventCount}
            </span>
          ) : (
            <div className="w-2 h-2 bg-neutral-400 rounded-full" />
          )}

          {/* Hot flame badge */}
          {isHot && (
            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5 shadow-sm">
              <Flame className="w-3 h-3 text-white" fill="white" />
            </div>
          )}
        </div>

        {/* Label */}
        <div
          className={`
            absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap
            transition-all duration-200
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md border border-neutral-100">
            <p className="text-xs font-semibold text-neutral-900">
              {neighborhood.shortName}
            </p>
            {hasEvents && neighborhood.nextEvent && (
              <p className="text-[10px] text-neutral-500 flex items-center gap-0.5 mt-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {formatNextEvent(neighborhood.nextEvent.datetime)}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function formatNextEvent(datetime: string): string {
  const date = new Date(datetime)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}
