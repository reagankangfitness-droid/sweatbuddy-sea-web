'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ThemeToggleProps {
  variant?: 'default' | 'header'
  isScrolled?: boolean
}

export function ThemeToggle({ variant = 'default', isScrolled = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'system':
        return <Monitor className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
        return 'System'
    }
  }

  if (variant === 'header') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        aria-label={`Current theme: ${getLabel()}. Click to change.`}
        title={getLabel()}
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg
          transition-colors duration-200
          ${isScrolled
            ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
        `}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    )
  }

  // Default variant with label
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>
      <span>{getLabel()}</span>
    </button>
  )
}
