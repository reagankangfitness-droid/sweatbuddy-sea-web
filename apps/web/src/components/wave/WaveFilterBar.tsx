'use client'

import { WAVE_ACTIVITIES, WAVE_ACTIVITY_TYPES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

interface WaveFilterBarProps {
  selected: Set<WaveActivityType | 'ALL'>
  onToggle: (key: WaveActivityType | 'ALL') => void
}

export function WaveFilterBar({ selected, onToggle }: WaveFilterBarProps) {
  return (
    <div className="absolute top-4 left-0 right-0 z-10 px-3">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onToggle('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.has('ALL')
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
              : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
          }`}
        >
          All
        </button>
        {WAVE_ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.has(type)
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
