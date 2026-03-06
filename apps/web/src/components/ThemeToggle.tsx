'use client'

import { Sun } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'default' | 'header'
  isScrolled?: boolean
}

// Light-only — theme toggle is a no-op, kept for API compatibility
export function ThemeToggle({ variant = 'default', isScrolled = false }: ThemeToggleProps) {
  if (variant === 'header') {
    return (
      <button
        aria-label="Light mode"
        title="Light mode"
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg
          transition-colors duration-200
          ${isScrolled
            ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
        `}
      >
        <Sun className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      aria-label="Light mode"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
    >
      <Sun className="w-4 h-4" />
      <span>Light mode</span>
    </button>
  )
}
