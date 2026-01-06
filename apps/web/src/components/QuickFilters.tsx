'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSelect = (id: string) => {
    setActive(id)
    onSelect(id)
  }

  // Check scroll position for arrow visibility
  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll)
      checkScroll()
      return () => scrollEl.removeEventListener('scroll', checkScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 150
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative md:hidden">
      {/* Left scroll indicator */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-600" />
        </button>
      )}

      {/* Right scroll indicator */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        </button>
      )}

      {/* Filters container */}
      <div
        ref={scrollRef}
        role="group"
        aria-label="Quick filters"
        className="overflow-x-auto scrollbar-hide -mx-4 px-4"
      >
        <div className="flex gap-2 py-2">
          {filters.map((filter) => {
            const isActive = active === filter.id
            return (
              <motion.button
                key={filter.id}
                onClick={() => handleSelect(filter.id)}
                whileTap={{ scale: 0.95 }}
                aria-pressed={isActive}
                aria-label={`Filter by ${filter.label}`}
                className={`
                  flex-shrink-0 flex items-center gap-1.5
                  px-4 py-2.5
                  text-sm font-medium
                  transition-all duration-200
                  rounded-full
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2
                  ${isActive
                    ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/20'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900'
                  }
                `}
              >
                <span className="text-base">{filter.emoji}</span>
                <span>{filter.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Gradient fade on edges */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      )}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      )}
    </div>
  )
}
