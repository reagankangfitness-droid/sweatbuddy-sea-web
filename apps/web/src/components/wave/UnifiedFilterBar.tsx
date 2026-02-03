'use client'

import { useEffect } from 'react'
import { ChevronDown, X, Waves, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

export type TimeFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND' | 'WEEK'
export type ContentFilter = 'ALL' | 'WAVES' | 'EVENTS'

interface UnifiedFilterBarProps {
  activityFilter: Set<WaveActivityType | 'ALL'>
  timeFilter: TimeFilter
  contentFilter: ContentFilter
  onActivityToggle: (key: WaveActivityType | 'ALL') => void
  onTimeSelect: (filter: TimeFilter) => void
  onContentFilterChange: (filter: ContentFilter) => void
  onOpenActivitySheet: () => void
}

const TIME_CHIPS: { key: TimeFilter; label: string }[] = [
  { key: 'TODAY', label: '🔥 Today' },
  { key: 'WEEKEND', label: '🎉 Weekend' },
  { key: 'WEEK', label: '📅 Week' },
]

// Activity categories for organized sheet
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

// Activity Selection Sheet Component - exported for use in WaveMap
export function ActivitySelectionSheet({
  isOpen,
  onClose,
  activityFilter,
  onSelect
}: {
  isOpen: boolean
  onClose: () => void
  activityFilter: Set<WaveActivityType | 'ALL'>
  onSelect: (activity: WaveActivityType | 'ALL') => void
}) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[70vh] flex flex-col"
            style={{ touchAction: 'pan-y' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Select Activity</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-2 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {/* All Activities option */}
              <button
                type="button"
                onClick={() => onSelect('ALL')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left mb-3 transition-colors ${
                  activityFilter.has('ALL')
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-xl">🌟</span>
                <span className="font-medium">All Activities</span>
              </button>

              {/* Categorized activities */}
              {ACTIVITY_CATEGORIES.map((category) => (
                <div key={category.name} className="mb-4">
                  <div className="px-1 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {category.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.activities.map((activity) => {
                      const info = WAVE_ACTIVITIES[activity]
                      const isSelected = activityFilter.has(activity)
                      return (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => onSelect(activity)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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

              {/* Bottom spacing for safe area */}
              <div className="h-8" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function UnifiedFilterBar({
  activityFilter,
  timeFilter,
  contentFilter,
  onActivityToggle,
  onTimeSelect,
  onContentFilterChange,
  onOpenActivitySheet
}: UnifiedFilterBarProps) {
  // Get selected activity label
  const getSelectedLabel = () => {
    if (activityFilter.has('ALL')) return 'All Activities'
    const selected = [...activityFilter].find((f): f is WaveActivityType => f !== 'ALL')
    if (selected && WAVE_ACTIVITIES[selected]) {
      return `${WAVE_ACTIVITIES[selected].emoji} ${WAVE_ACTIVITIES[selected].label}`
    }
    return 'All Activities'
  }

  return (
    <div
      className="absolute top-4 left-0 md:left-14 right-0 z-40 px-3 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex items-center gap-2 w-max pr-3">
        {/* Content filter chips - Waves / Events */}
        <button
          type="button"
          onClick={() => onContentFilterChange(contentFilter === 'WAVES' ? 'ALL' : 'WAVES')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
            contentFilter === 'WAVES'
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
              : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>Waves</span>
        </button>

        <button
          type="button"
          onClick={() => onContentFilterChange(contentFilter === 'EVENTS' ? 'ALL' : 'EVENTS')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
            contentFilter === 'EVENTS'
              ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25'
              : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Events</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Activity Button */}
        <div className="relative">
          <button
            type="button"
            onClick={onOpenActivitySheet}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
              !activityFilter.has('ALL')
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-white/95 dark:bg-neutral-800/95 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <span className="max-w-[120px] truncate">{getSelectedLabel()}</span>
            <ChevronDown className="w-4 h-4" />
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
