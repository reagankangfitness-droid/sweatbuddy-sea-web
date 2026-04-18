'use client'

import { cn } from '@/lib/utils'

interface FilterPill {
  value: string
  label: string
  emoji?: string
}

interface FilterPillsProps {
  pills: FilterPill[]
  selected: string
  onSelect: (value: string) => void
  className?: string
}

export function FilterPills({ pills, selected, onSelect, className }: FilterPillsProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide', className)}>
      {pills.map((pill) => {
        const active = selected === pill.value
        return (
          <button
            key={pill.value}
            onClick={() => onSelect(pill.value)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border',
              active
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#1A1A1A] text-[#666666] border-[#333333] hover:border-[#666666] hover:text-white'
            )}
          >
            {pill.emoji && <span className="text-[13px]">{pill.emoji}</span>}
            {pill.label}
          </button>
        )
      })}
    </div>
  )
}
