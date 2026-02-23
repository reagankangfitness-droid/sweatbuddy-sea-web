'use client'

import dynamicImport from 'next/dynamic'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, Check } from 'lucide-react'
import { DatePickerDropdown } from '@/components/ui/DatePickerDropdown'
import { TimePickerDropdown } from '@/components/ui/TimePickerDropdown'
import type { EventFormData } from '@/lib/validations/event'

const LocationAutocomplete = dynamicImport(
  () => import('../LocationAutocomplete').then(mod => ({ default: mod.LocationAutocomplete })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl">
        <MapPin className="w-5 h-5 text-neutral-500 shrink-0" />
        <span className="text-neutral-500">Loading location search...</span>
      </div>
    ),
  }
)

interface StepLocationProps {
  mode: 'create' | 'edit'
  userTimezone: { name: string; abbr: string; offset: string }
}

export function StepLocation({ mode, userTimezone }: StepLocationProps) {
  const { setValue, watch, formState: { errors } } = useFormContext<EventFormData>()

  const location = watch('location')
  const isRecurring = watch('isRecurring')
  const eventDay = watch('eventDay')
  const scheduleEnabled = watch('scheduleEnabled')
  const scheduleDate = watch('scheduleDate')
  const scheduleTime = watch('scheduleTime')
  const eventDate = watch('eventDate')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Where is it happening?</h2>

      {/* Location Input */}
      <LocationAutocomplete
        value={location}
        hasError={!!errors.location}
        onManualChange={(value) => {
          setValue('location', value, { shouldValidate: true })
        }}
        onChange={(data) => {
          setValue('location', data.location, { shouldValidate: true })
          setValue('latitude', data.latitude)
          setValue('longitude', data.longitude)
          setValue('placeId', data.placeId)
        }}
      />
      {errors.location && (
        <p className="text-red-400 text-sm">{errors.location.message}</p>
      )}

      {/* Recurring Toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <button
          type="button"
          onClick={() => setValue('isRecurring', !isRecurring)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isRecurring
              ? 'bg-white border-white'
              : 'border-neutral-600 bg-transparent group-hover:border-neutral-500'
          }`}
        >
          {isRecurring && <Check className="w-3 h-3 text-neutral-900" />}
        </button>
        <span className="text-neutral-400 text-sm">Set this event to repeat</span>
      </label>

      {/* Recurring Day Selection */}
      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <select
              value={eventDay}
              onChange={(e) => setValue('eventDay', e.target.value, { shouldValidate: true })}
              className={`w-full px-4 py-3 bg-neutral-900 border rounded-xl text-white focus:outline-none focus:border-neutral-500 appearance-none [color-scheme:dark] ${
                errors.eventDay ? 'border-red-500' : 'border-neutral-700'
              }`}
            >
              <option value="">Select repeat frequency...</option>
              <option value="Every Monday">Every Monday</option>
              <option value="Every Tuesday">Every Tuesday</option>
              <option value="Every Wednesday">Every Wednesday</option>
              <option value="Every Thursday">Every Thursday</option>
              <option value="Every Friday">Every Friday</option>
              <option value="Every Saturday">Every Saturday</option>
              <option value="Every Sunday">Every Sunday</option>
              <option value="Daily">Daily</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
            </select>
            {errors.eventDay && (
              <p className="text-red-400 text-sm mt-1">{errors.eventDay.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Publish Toggle (create mode only) */}
      {mode === 'create' && (
        <>
          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setValue('scheduleEnabled', !scheduleEnabled)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                scheduleEnabled
                  ? 'bg-white border-white'
                  : 'border-neutral-600 bg-transparent group-hover:border-neutral-500'
              }`}
            >
              {scheduleEnabled && <Check className="w-3 h-3 text-neutral-900" />}
            </button>
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-400 text-sm">Schedule for later</span>
          </label>

          <AnimatePresence>
            {scheduleEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <DatePickerDropdown
                      value={scheduleDate || ''}
                      onChange={(date) => setValue('scheduleDate', date)}
                      min={new Date().toISOString().split('T')[0]}
                      max={eventDate || undefined}
                      placeholder="Pick a date"
                    />
                    <TimePickerDropdown
                      value={scheduleTime || ''}
                      onChange={(time) => setValue('scheduleTime', time)}
                      placeholder="Pick a time"
                    />
                    <div className="px-3 py-2.5 bg-neutral-800 rounded-full" title={userTimezone.name}>
                      <span className="text-sm text-neutral-400">{userTimezone.abbr || userTimezone.offset}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">Your event will go live at this time</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
