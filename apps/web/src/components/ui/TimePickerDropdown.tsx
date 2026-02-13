'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

interface TimePickerDropdownProps {
  value: string
  onChange: (time: string) => void
  placeholder?: string
  hasError?: boolean
}

// Generate 48 half-hour slots: "00:00" through "23:30"
function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, '0')
      const mm = m.toString().padStart(2, '0')
      const value = `${hh}:${mm}`

      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      const label = `${h12}:${mm} ${period}`

      slots.push({ value, label })
    }
  }
  return slots
}

export function TimePickerDropdown({
  value,
  onChange,
  placeholder = 'Start time',
  hasError = false,
}: TimePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const slots = useMemo(() => generateTimeSlots(), [])

  // Format display value
  const displayText = useMemo(() => {
    if (!value) return null
    const slot = slots.find(s => s.value === value)
    if (slot) return slot.label
    // Fallback: manually format
    const [hStr, mStr] = value.split(':')
    const h = parseInt(hStr, 10)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${mStr} ${period}`
  }, [value, slots])

  // Click outside + Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Auto-scroll to selected time on open
  useEffect(() => {
    if (open && listRef.current && value) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center' })
      }
    }
  }, [open, value])

  return (
    <div ref={containerRef} className="relative">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border rounded-full cursor-pointer hover:bg-neutral-800 transition-colors text-sm ${
          hasError ? 'border-red-500' : 'border-neutral-700'
        }`}
      >
        <Clock className="w-4 h-4 text-neutral-400" />
        {displayText ? (
          <span className="text-white">{displayText}</span>
        ) : (
          <span className="text-neutral-500">{placeholder}</span>
        )}
      </button>

      {/* Time list dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg overflow-hidden w-[160px]"
          >
            <div ref={listRef} className="max-h-[280px] overflow-y-auto py-1">
              {slots.map((slot) => {
                const isSelected = slot.value === value
                return (
                  <button
                    key={slot.value}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      onChange(slot.value)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-white text-neutral-900 font-semibold'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {slot.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
