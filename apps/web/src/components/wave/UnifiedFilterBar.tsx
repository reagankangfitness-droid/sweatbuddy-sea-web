'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

export type TimeFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND' | 'WEEK'

interface UnifiedFilterBarProps {
  activityFilter: Set<WaveActivityType | 'ALL'>
  timeFilter: TimeFilter
  onActivityToggle: (key: WaveActivityType | 'ALL') => void
  onTimeSelect: (filter: TimeFilter) => void
}

const TIME_CHIPS: { key: TimeFilter; label: string }[] = [
  { key: 'TODAY', label: '🔥 Today' },
  { key: 'WEEKEND', label: '🎉 Weekend' },
  { key: 'WEEK', label: '📅 Week' },
]

// Activity categories for organized dropdown
const ACTIVITY_CATEGORIES: { name: string; activities: WaveActivityType[] }[] = [
  {
    name: 'Cardio & Endurance',
    activities: ['RUN', 'WALK', 'CYCLE', 'SWIM', 'HIKE', 'ROWING', 'SURFING', 'SPINNING'],
  },
  {
    name: 'Strength & Conditioning',
    activities: ['GYM', 'CROSSFIT', 'HYROX', 'STRETCHING', 'PILATES'],
  },
  {
    name: 'Racquet Sports',
    activities: ['TENNIS', 'PICKLEBALL', 'BADMINTON', 'SQUASH'],
  },
  {
    name: 'Team Sports',
    activities: ['BASKETBALL', 'FOOTBALL', 'VOLLEYBALL', 'FRISBEE'],
  },
  {
    name: 'Combat & Martial Arts',
    activities: ['BOXING', 'MARTIAL_ARTS'],
  },
  {
    name: 'Other Sports',
    activities: ['CLIMB', 'GOLF', 'SKATEBOARD', 'DANCE'],
  },
  {
    name: 'Wellness & Recovery',
    activities: ['YOGA', 'MEDITATION', 'BREATHWORK', 'ICE_BATH', 'SAUNA'],
  },
  {
    name: 'Self-Improvement',
    activities: ['BOOK_CLUB', 'NUTRITION'],
  },
  {
    name: 'Flexible',
    activities: ['ANYTHING'],
  },
]

export function UnifiedFilterBar({
  activityFilter,
  timeFilter,
  onActivityToggle,
  onTimeSelect
}: UnifiedFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get selected activity label
  const getSelectedLabel = () => {
    if (activityFilter.has('ALL')) return 'All Activities'
    const selected = [...activityFilter].find((f): f is WaveActivityType => f !== 'ALL')
    if (selected && WAVE_ACTIVITIES[selected]) {
      return `${WAVE_ACTIVITIES[selected].emoji} ${WAVE_ACTIVITIES[selected].label}`
    }
    return 'All Activities'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle activity selection
  const handleSelect = (activity: WaveActivityType | 'ALL') => {
    onActivityToggle(activity)
    setIsOpen(false)
  }

  return (
    <div
      className="absolute top-4 left-0 md:left-14 right-0 z-40 px-3 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'manipulation' }}
    >
      <div className="flex items-center gap-2 w-max pr-3">
        {/* Activity Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{ touchAction: 'manipulation' }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
              !activityFilter.has('ALL')
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <span className="max-w-[120px] truncate">{getSelectedLabel()}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear filter button */}
          {!activityFilter.has('ALL') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onActivityToggle('ALL')
              }}
              className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-72 max-h-[60vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl z-[100]"
              >
                {/* All Activities option */}
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleSelect('ALL')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      activityFilter.has('ALL')
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <span className="text-lg">🌟</span>
                    <span>All Activities</span>
                  </button>
                </div>

                {/* Categorized activities */}
                <div className="p-2">
                  {ACTIVITY_CATEGORIES.map((category) => (
                    <div key={category.name} className="mb-3 last:mb-0">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {category.name}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {category.activities.map((activity) => {
                          const info = WAVE_ACTIVITIES[activity]
                          const isSelected = activityFilter.has(activity)
                          return (
                            <button
                              key={activity}
                              type="button"
                              onClick={() => handleSelect(activity)}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                              }`}
                            >
                              <span>{info.emoji}</span>
                              <span className="truncate">{info.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time filter chips */}
        {TIME_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onTimeSelect(timeFilter === chip.key ? 'ALL' : chip.key)}
            className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
              timeFilter === chip.key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg shadow-pink-500/25'
                : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
