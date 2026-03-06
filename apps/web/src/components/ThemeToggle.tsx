'use client'

import { Moon } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'default' | 'header'
  isScrolled?: boolean
}

// Dark-only — theme toggle is a no-op, kept for API compatibility
export function ThemeToggle({ variant = 'default', isScrolled = false }: ThemeToggleProps) {
  if (variant === 'header') {
    return (
      <button
        aria-label="Dark mode"
        title="Dark mode"
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg
          transition-colors duration-200
          ${isScrolled
            ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
        `}
      >
        <Moon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      aria-label="Dark mode"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
    >
      <Moon className="w-4 h-4" />
      <span>Dark mode</span>
    </button>
  )
}
