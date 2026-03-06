'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  X,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { CATEGORY_GROUPS, getCategoriesByGroup } from '@/lib/categories'
import { DatePickerDropdown } from '@/components/ui/DatePickerDropdown'
import { TimePickerDropdown } from '@/components/ui/TimePickerDropdown'
import type { EventFormData } from '@/lib/validations/event'

interface StepDetailsProps {
  userTimezone: { name: string; abbr: string; offset: string }
}

export function StepDetails({ userTimezone }: StepDetailsProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<EventFormData>()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false)
  const [aiDescError, setAiDescError] = useState<string | null>(null)

  const eventType = watch('eventType')
  const eventDate = watch('eventDate')
  const eventTime = watch('eventTime')
  const endTime = watch('endTime')
  const description = watch('description')
  const eventName = watch('eventName')
  const location = watch('location')

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const handleGenerateDescription = async () => {
    if (!eventName) {
      setAiDescError('Add an event name first')
      return
    }
    setIsGeneratingDesc(true)
    setAiDescError(null)
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventName,
          category: eventType,
          location: location,
          dateTime: eventDate && eventTime
            ? `${eventDate} ${formatTime12Hour(eventTime)}`
            : undefined,
          additionalContext: description || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setAiDescError(data.error || 'Failed to generate')
        return
      }
      const data = await res.json()
      if (data.description) {
        setValue('description', data.description)
      }
    } catch {
      setAiDescError('Something went wrong. Try again.')
    } finally {
      setIsGeneratingDesc(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Name */}
      <div>
        <input
          type="text"
          {...register('eventName')}
          placeholder="Enter experience name"
          className={`w-full text-3xl md:text-4xl font-bold bg-transparent border-none text-white placeholder:text-neutral-600 focus:outline-none focus:ring-0 ${errors.eventName ? 'placeholder:text-red-400' : ''}`}
        />
        {errors.eventName && (
          <p className="text-red-400 text-sm mt-1">{errors.eventName.message}</p>
        )}
      </div>

      {/* Date/Time Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePickerDropdown
          value={eventDate}
          onChange={(date) => setValue('eventDate', date, { shouldValidate: true })}
          min={new Date().toISOString().split('T')[0]}
          placeholder="Pick a date"
          hasError={!!errors.eventDate}
        />

        <TimePickerDropdown
          value={eventTime}
          onChange={(time) => setValue('eventTime', time, { shouldValidate: true })}
          placeholder="Start time"
          hasError={!!errors.eventTime}
        />

        <TimePickerDropdown
          value={endTime || ''}
          onChange={(time) => setValue('endTime', time)}
          placeholder="End time"
        />

        <div className="px-3 py-2.5 bg-neutral-800 rounded-full" title={userTimezone.name}>
          <span className="text-sm text-neutral-400">{userTimezone.abbr || userTimezone.offset}</span>
        </div>
      </div>
      {errors.eventDate && (
        <p className="text-red-400 text-sm">{errors.eventDate.message}</p>
      )}
      {errors.eventTime && (
        <p className="text-red-400 text-sm">{errors.eventTime.message}</p>
      )}

      {/* Description Input */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl focus-within:border-neutral-500 transition-colors">
          <FileText className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
          <textarea
            {...register('description')}
            placeholder="Add experience description"
            rows={description ? 6 : 3}
            className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGeneratingDesc}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
          >
            {isGeneratingDesc ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Writing your description...
              </>
            ) : description ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate with AI
              </>
            )}
          </button>
          {aiDescError && (
            <span className="text-xs text-red-400">{aiDescError}</span>
          )}
        </div>
      </div>

      {/* Activity Type Selection */}
      <div className="space-y-3">
        <h3 className={`text-lg font-semibold ${errors.eventType ? 'text-red-400' : 'text-white'}`}>
          What type of experience is this?
        </h3>
        {errors.eventType && (
          <p className="text-red-400 text-sm">{errors.eventType.message}</p>
        )}

        {/* Selected activity chip */}
        {eventType && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-sm bg-neutral-950 text-neutral-100 border border-neutral-700 font-medium">
              {eventType}
            </span>
            <button
              type="button"
              onClick={() => {
                setValue('eventType', '', { shouldValidate: true })
                setActiveGroup(null)
              }}
              className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        )}

        {/* Group pills */}
        {!eventType && (
          <div className="flex flex-wrap gap-2">
            {CATEGORY_GROUPS
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(group => {
                const isActive = activeGroup === group.slug
                return (
                  <button
                    key={group.slug}
                    type="button"
                    onClick={() => setActiveGroup(isActive ? null : group.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      isActive
                        ? 'bg-neutral-950 text-neutral-100 border-neutral-700 font-medium'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {group.emoji} {group.name}
                  </button>
                )
              })}
          </div>
        )}

        {/* Activities in selected group */}
        <AnimatePresence>
          {activeGroup && !eventType && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {getCategoriesByGroup(activeGroup).map(cat => {
                  const value = `${cat.emoji} ${cat.name}`
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setValue('eventType', value, { shouldValidate: true })
                      }}
                      className="px-3 py-1.5 rounded-full text-sm border bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-colors"
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
