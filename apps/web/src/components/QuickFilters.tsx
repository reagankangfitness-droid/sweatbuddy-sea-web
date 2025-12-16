'use client'

import { useState } from 'react'

const filters = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'today', label: 'Today', emoji: '📅' },
  { id: 'weekend', label: 'Weekend', emoji: '🎉' },
  { id: 'run', label: 'Running', emoji: '🏃' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'hiit', label: 'HIIT', emoji: '🔥' },
  { id: 'social', label: 'Social', emoji: '🤝' },
]

interface Props {
  onSelect: (filter: string) => void
  activeFilter?: string
}

export function QuickFilters({ onSelect, activeFilter = 'all' }: Props) {
  const [active, setActive] = useState(activeFilter)

  const handleSelect = (id: string) => {
    setActive(id)
    onSelect(id)
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:hidden">
      <div className="flex gap-2 py-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleSelect(filter.id)}
            className={`
              flex-shrink-0 flex items-center gap-2
              px-4 py-2.5
              font-medium text-sm
              transition-all duration-200
              active:scale-95
              border-2 border-navy
              ${active === filter.id
                ? 'bg-navy text-sand'
                : 'bg-white text-navy'
              }
            `}
            style={{
              boxShadow: active === filter.id
                ? 'none'
                : '3px 3px 0px 0px #0F172A',
              transform: active === filter.id
                ? 'translate(2px, 2px)'
                : 'none',
            }}
          >
            <span>{filter.emoji}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
