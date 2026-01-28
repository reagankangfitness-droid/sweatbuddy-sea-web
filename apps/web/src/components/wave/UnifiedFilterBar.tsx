'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { WAVE_ACTIVITIES, WAVE_ACTIVITY_TYPES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

export type TimeFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND' | 'WEEK'

interface UnifiedFilterBarProps {
  activityFilter: Set<WaveActivityType | 'ALL'>
  timeFilter: TimeFilter
  onActivityToggle: (key: WaveActivityType | 'ALL') => void
  onTimeSelect: (filter: TimeFilter) => void
}

const TIME_OPTIONS: { key: TimeFilter; label: string; shortLabel: string }[] = [
  { key: 'ALL', label: 'All times', shortLabel: 'When' },
  { key: 'TODAY', label: '🔥 Today', shortLabel: '🔥 Today' },
  { key: 'TOMORROW', label: 'Tomorrow', shortLabel: 'Tomorrow' },
  { key: 'WEEKEND', label: '🎉 This Weekend', shortLabel: '🎉 Weekend' },
  { key: 'WEEK', label: '📅 This Week', shortLabel: '📅 Week' },
]

export function UnifiedFilterBar({
  activityFilter,
  timeFilter,
  onActivityToggle,
  onTimeSelect
}: UnifiedFilterBarProps) {
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTimeOption = TIME_OPTIONS.find(t => t.key === timeFilter) || TIME_OPTIONS[0]

  return (
    <div className="absolute top-4 left-0 right-0 z-10 px-3">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar items-center">
        {/* When dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              timeFilter !== 'ALL'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg shadow-pink-500/25'
                : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600'
            }`}
          >
            {selectedTimeOption.shortLabel}
            <ChevronDown className={`w-3 h-3 transition-transform ${showTimeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {showTimeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-20">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    onTimeSelect(option.key)
                    setShowTimeDropdown(false)
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                    timeFilter === option.key
                      ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-medium'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 shrink-0" />

        {/* Activity filters */}
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
