'use client'

import { useState } from 'react'
import { Check, X, Minus } from 'lucide-react'

interface AttendanceToggleProps {
  attendeeId: string
  eventId: string
  initialValue: boolean | null
  onUpdate?: (value: boolean | null) => void
}

export function AttendanceToggle({
  attendeeId,
  eventId,
  initialValue,
  onUpdate,
}: AttendanceToggleProps) {
  const [value, setValue] = useState<boolean | null>(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (newValue: boolean | null) => {
    if (isLoading) return

    const previousValue = value
    setValue(newValue) // Optimistic update
    setIsLoading(true)

    try {
      const res = await fetch(`/api/host/events/${eventId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, attended: newValue }),
      })

      if (!res.ok) throw new Error('Failed to update')

      onUpdate?.(newValue)
    } catch {
      setValue(previousValue) // Rollback on error
    } finally {
      setIsLoading(false)
    }
  }

  const cycleValue = () => {
    // Cycle: null -> true -> false -> null
    if (value === null) handleToggle(true)
    else if (value === true) handleToggle(false)
    else handleToggle(null)
  }

  return (
    <button
      onClick={cycleValue}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${value === true
          ? 'bg-green-50 border-green-500 text-green-600'
          : value === false
            ? 'bg-red-50 border-red-400 text-red-500'
            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
        }
      `}
      title={
        value === true
          ? 'Attended - Click to mark as no-show'
          : value === false
            ? 'No-show - Click to clear'
            : 'Not marked - Click to mark attended'
      }
    >
      {value === true && <Check className="w-4 h-4" strokeWidth={3} />}
      {value === false && <X className="w-4 h-4" strokeWidth={3} />}
      {value === null && <Minus className="w-4 h-4" strokeWidth={2} />}
    </button>
  )
}

// Compact version for tables
export function AttendanceToggleCompact({
  attendeeId,
  eventId,
  initialValue,
  onUpdate,
}: AttendanceToggleProps) {
  const [value, setValue] = useState<boolean | null>(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (newValue: boolean | null) => {
    if (isLoading) return

    const previousValue = value
    setValue(newValue)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/host/events/${eventId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, attended: newValue }),
      })

      if (!res.ok) throw new Error('Failed to update')

      onUpdate?.(newValue)
    } catch {
      setValue(previousValue)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleToggle(value === true ? null : true)}
        disabled={isLoading}
        className={`
          p-1.5 rounded transition-all
          ${isLoading ? 'opacity-50' : 'hover:bg-green-100'}
          ${value === true ? 'bg-green-100 text-green-600' : 'text-neutral-300 hover:text-green-500'}
        `}
        title="Mark as attended"
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <button
        onClick={() => handleToggle(value === false ? null : false)}
        disabled={isLoading}
        className={`
          p-1.5 rounded transition-all
          ${isLoading ? 'opacity-50' : 'hover:bg-red-100'}
          ${value === false ? 'bg-red-100 text-red-500' : 'text-neutral-300 hover:text-red-400'}
        `}
        title="Mark as no-show"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
