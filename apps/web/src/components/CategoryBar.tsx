'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const categories = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'running', label: 'Running', icon: '🏃' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'hiit', label: 'HIIT', icon: '🔥' },
  { id: 'bootcamp', label: 'Bootcamp', icon: '💪' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'hiking', label: 'Hiking', icon: '🥾' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'combat', label: 'Combat', icon: '🥊' },
  { id: 'meditation', label: 'Mindfulness', icon: '🧘‍♂️' },
]

interface CategoryBarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryBar({ selectedCategory, onCategoryChange }: CategoryBarProps) {
  return (
    <div className="relative">
      {/* Scrollable container */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 md:gap-3 py-2 min-w-max">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id
            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all min-w-[72px] ${
                  isSelected
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{category.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Fade edges on mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-50 dark:from-neutral-950 to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-transparent pointer-events-none md:hidden" />
    </div>
  )
}

// Mapping from category labels to filter values
export const categoryMapping: Record<string, string[]> = {
  all: [],
  running: ['Run Club', 'Running'],
  yoga: ['Yoga'],
  hiit: ['HIIT'],
  bootcamp: ['Bootcamp'],
  dance: ['Dance', 'Dance Fitness'],
  hiking: ['Hiking'],
  outdoor: ['Outdoor', 'Outdoor Fitness'],
  combat: ['Combat'],
  meditation: ['Meditation', 'Breathwork'],
}
