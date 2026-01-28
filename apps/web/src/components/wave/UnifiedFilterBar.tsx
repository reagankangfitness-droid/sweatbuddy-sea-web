'use client'

import { WAVE_ACTIVITIES, WAVE_ACTIVITY_TYPES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

export type TimeFilter = 'ALL' | 'TODAY' | 'WEEKEND' | 'WEEK'

interface UnifiedFilterBarProps {
  activityFilter: Set<WaveActivityType | 'ALL'>
  timeFilter: TimeFilter
  onActivityToggle: (key: WaveActivityType | 'ALL') => void
  onTimeSelect: (filter: TimeFilter) => void
}

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'TODAY', label: '🔥 Today' },
  { key: 'WEEKEND', label: '🎉 Weekend' },
  { key: 'WEEK', label: '📅 Week' },
]

export function UnifiedFilterBar({
  activityFilter,
  timeFilter,
  onActivityToggle,
  onTimeSelect
}: UnifiedFilterBarProps) {
  return (
    <div className="absolute top-4 left-0 right-0 z-10 px-3 space-y-2">
      {/* Time filters - prominent row */}
      <div className="flex gap-1.5">
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onTimeSelect(timeFilter === filter.key ? 'ALL' : filter.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              timeFilter === filter.key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Activity type filters - scrollable row */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => onActivityToggle('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activityFilter.has('ALL')
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
              : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
          }`}
        >
          All
        </button>
        {WAVE_ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onActivityToggle(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activityFilter.has(type)
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {WAVE_ACTIVITIES[type].emoji} {WAVE_ACTIVITIES[type].label}
          </button>
        ))}
      </div>
    </div>
  )
}
