'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns'

interface DatePickerDropdownProps {
  value: string
  onChange: (date: string) => void
  min?: string
  max?: string
  placeholder?: string
  hasError?: boolean
}

export function DatePickerDropdown({
  value,
  onChange,
  min,
  max,
  placeholder = 'Pick a date',
  hasError = false,
}: DatePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? parseISO(value) : null
  const [viewMonth, setViewMonth] = useState(() =>
    selectedDate ?? new Date()
  )

  // Reset view month when value changes externally
  useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const minDate = min ? parseISO(min) : undefined
  const maxDate = max ? parseISO(max) : undefined

  const isDisabled = useCallback(
    (day: Date) => {
      if (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) return true
      if (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate)) return true
      return false
    },
    [minDate, maxDate]
  )

  // Build the 6-row calendar grid
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Ensure exactly 42 cells (6 rows)
  while (days.length < 42) {
    const lastDay = days[days.length - 1]
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1))
  }

  const today = new Date()

  const displayText = selectedDate
    ? format(selectedDate, 'EEE, d MMM')
    : null

  return (
    <div ref={containerRef} className="relative">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-full cursor-pointer hover:bg-neutral-100 transition-colors text-sm ${
          hasError ? 'border-red-500' : 'border-black/[0.06]'
        }`}
      >
        <Calendar className="w-4 h-4 text-[#71717A]" />
        {displayText ? (
          <span className="text-[#1A1A1A]">{displayText}</span>
        ) : (
          <span className="text-[#71717A]">{placeholder}</span>
        )}
      </button>

      {/* Calendar dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white border border-black/[0.06] rounded-xl shadow-lg p-3 w-[280px]"
          >
            {/* Header: month/year + nav */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(prev => subMonths(prev, 1))}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#71717A]" />
              </button>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {format(viewMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(prev => addMonths(prev, 1))}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#71717A]" />
              </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-[#71717A] py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const inMonth = isSameMonth(day, viewMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, today)
                const disabled = !inMonth || isDisabled(day)

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(format(day, 'yyyy-MM-dd'))
                      setOpen(false)
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#FFFBF8] text-[#1A1A1A] font-semibold'
                        : isToday && inMonth
                          ? 'ring-1 ring-black/[0.12] text-[#1A1A1A]'
                          : ''
                    } ${
                      disabled
                        ? 'text-[#4A4A5A] cursor-default'
                        : inMonth
                          ? 'text-[#1A1A1A] hover:bg-neutral-100 cursor-pointer'
                          : 'text-[#4A4A5A]'
                    }`}
                  >
                    {day.getDate()}
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
