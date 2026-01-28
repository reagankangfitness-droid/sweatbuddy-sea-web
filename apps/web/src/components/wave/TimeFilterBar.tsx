'use client'

export type TimeFilter = 'ALL' | 'TODAY' | 'WEEKEND' | 'WEEK'

interface TimeFilterBarProps {
  selected: TimeFilter
  onSelect: (filter: TimeFilter) => void
}

const TIME_FILTERS: { key: TimeFilter; label: string; emoji: string }[] = [
  { key: 'ALL', label: 'All', emoji: '📍' },
  { key: 'TODAY', label: 'Today', emoji: '🔥' },
  { key: 'WEEKEND', label: 'Weekend', emoji: '🎉' },
  { key: 'WEEK', label: 'This Week', emoji: '📅' },
]

export function TimeFilterBar({ selected, onSelect }: TimeFilterBarProps) {
  return (
    <div className="absolute top-[52px] left-0 right-0 z-10 px-3">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onSelect(filter.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected === filter.key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500'
                : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {filter.emoji} {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
