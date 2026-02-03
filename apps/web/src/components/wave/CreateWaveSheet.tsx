'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { WAVE_ACTIVITIES, WAVE_ACTIVITY_TYPES, WAVE_QUICK_PROMPTS } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

interface CreateWaveSheetProps {
  isOpen: boolean
  onClose: () => void
  onCreateWave: (data: {
    activityType: WaveActivityType
    area: string
    thought?: string
    locationName?: string
    latitude?: number
    longitude?: number
    scheduledFor?: string
  }) => Promise<void>
  userPosition: { lat: number; lng: number } | null
}

type Step = 'activity' | 'details'

const TIME_OPTIONS = [
  '6:00am', '6:30am', '7:00am', '7:30am', '8:00am', '8:30am', '9:00am', '9:30am',
  '10:00am', '10:30am', '11:00am', '11:30am', '12:00pm', '12:30pm',
  '1:00pm', '1:30pm', '2:00pm', '2:30pm', '3:00pm', '3:30pm',
  '4:00pm', '4:30pm', '5:00pm', '5:30pm', '6:00pm', '6:30pm',
  '7:00pm', '7:30pm', '8:00pm', '8:30pm', '9:00pm',
]

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const now = new Date()
  const base = new Date(now)

  if (dateStr === 'tomorrow') {
    base.setDate(base.getDate() + 1)
  }

  // Parse time like "6:30pm"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(am|pm)$/i)
  if (!match) return base

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toLowerCase()

  if (ampm === 'pm' && hours !== 12) hours += 12
  if (ampm === 'am' && hours === 12) hours = 0

  base.setHours(hours, minutes, 0, 0)
  return base
}

export function CreateWaveSheet({ isOpen, onClose, onCreateWave, userPosition }: CreateWaveSheetProps) {
  const [step, setStep] = useState<Step>('activity')
  const [selectedType, setSelectedType] = useState<WaveActivityType | null>(null)
  const [thought, setThought] = useState('')
  const [area, setArea] = useState('')
  const [locationName, setLocationName] = useState('')
  const [placeLat, setPlaceLat] = useState<number | undefined>()
  const [placeLng, setPlaceLng] = useState<number | undefined>()
  const [dateOption, setDateOption] = useState('today')
  const [timeOption, setTimeOption] = useState('')
  const [creating, setCreating] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Google Maps Places Autocomplete
  const initAutocomplete = useCallback(() => {
    if (!locationInputRef.current || autocompleteRef.current) return
    if (!window.google?.maps?.places) return
    const ac = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'geometry', 'name'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place.name) setLocationName(place.name)
      if (place.formatted_address) setArea(place.formatted_address)
      if (place.geometry?.location) {
        setPlaceLat(place.geometry.location.lat())
        setPlaceLng(place.geometry.location.lng())
      }
    })
    autocompleteRef.current = ac
  }, [])

  useEffect(() => {
    if (step === 'details') {
      const timer = setTimeout(initAutocomplete, 100)
      return () => clearTimeout(timer)
    } else {
      autocompleteRef.current = null
    }
  }, [step, initAutocomplete])

  const reset = () => {
    setStep('activity')
    setSelectedType(null)
    setThought('')
    setArea('')
    setLocationName('')
    setPlaceLat(undefined)
    setPlaceLng(undefined)
    setDateOption('today')
    setTimeOption('')
    setCreating(false)
    autocompleteRef.current = null
  }

  const handleClose = () => {
    onClose()
    reset()
  }

  const handleSelectActivity = (type: WaveActivityType) => {
    setSelectedType(type)
    setStep('details')
  }

  const isValid = !!(thought.trim() && locationName.trim() && timeOption)

  const handleCreate = async () => {
    if (!selectedType || !isValid) return
    setCreating(true)
    try {
      const scheduledDate = parseTimeToDate(dateOption, timeOption)
      const finalArea = area.trim() || locationName.trim()

      await onCreateWave({
        activityType: selectedType,
        area: finalArea,
        thought: thought.trim(),
        locationName: locationName.trim() || undefined,
        latitude: placeLat ?? userPosition?.lat,
        longitude: placeLng ?? userPosition?.lng,
        scheduledFor: scheduledDate.getTime() > Date.now() ? scheduledDate.toISOString() : undefined,
      })
      toast.success(`Wave started! ${WAVE_ACTIVITIES[selectedType].emoji} ${WAVE_ACTIVITIES[selectedType].label} in ${finalArea}`)
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create wave. Please try again.')
      setCreating(false)
    }
  }

  const dateLabel = dateOption === 'today' ? 'Today' : dateOption === 'tomorrow' ? 'Tomorrow' : dateOption

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end pb-16"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <motion.div
            className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl flex flex-col max-h-[75dvh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              {step === 'details' ? (
                <button onClick={() => setStep('activity')} className="p-2 -m-1 text-neutral-500">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-7" />
              )}
              <h2 className="font-bold text-neutral-900 dark:text-white">
                {step === 'activity' ? 'Start a Wave' : WAVE_ACTIVITIES[selectedType!].emoji + ' ' + WAVE_ACTIVITIES[selectedType!].label}
              </h2>
              <button onClick={handleClose} className="p-2 -m-1 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="px-4 pb-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {/* Step 1: Activity grid */}
              {step === 'activity' && (
                <div className="grid grid-cols-3 gap-2.5 py-4">
                  {WAVE_ACTIVITY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectActivity(type)}
                      className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                    >
                      <span className="text-2xl">{WAVE_ACTIVITIES[type].emoji}</span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {WAVE_ACTIVITIES[type].label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Details */}
              {step === 'details' && selectedType && (
                <div className="space-y-5 py-4">
                  {/* Thought bubble */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                      <span>💭</span> What&apos;s on your mind?
                    </label>
                    <textarea
                      value={thought}
                      onChange={(e) => setThought(e.target.value.slice(0, 140))}
                      placeholder="E.g., Looking for a chill running buddy, no pressure on pace..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500 resize-none"
                    />
                    <p className="text-right text-[10px] text-neutral-400 mt-0.5">{thought.length}/140</p>
                    {/* Quick prompts */}
                    {!thought && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {WAVE_QUICK_PROMPTS[selectedType].map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setThought(prompt)}
                            className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location with Google Places autocomplete */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                      <span>📍</span> Where?
                    </label>
                    <input
                      ref={locationInputRef}
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Where's the meetup?"
                      maxLength={300}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                    />
                    {area && (
                      <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{area}</p>
                    )}
                    {!locationName && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Local park', 'Downtown gym', 'Beach', 'Trail nearby', 'Community center', 'My neighborhood'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => { setLocationName(loc); setArea(loc) }}
                            className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date and Time dropdowns */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                      <span>📅</span> When?
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={dateOption}
                        onChange={(e) => setDateOption(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400 dark:focus:border-neutral-500 appearance-none"
                      >
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                      </select>
                      <select
                        value={timeOption}
                        onChange={(e) => setTimeOption(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400 dark:focus:border-neutral-500 appearance-none"
                      >
                        <option value="">What time?</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview card */}
                  {(thought || locationName || timeOption) && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                      <p className="text-[10px] text-neutral-500 mb-2">Preview</p>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg shrink-0">
                          {WAVE_ACTIVITIES[selectedType].emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-white text-sm">{WAVE_ACTIVITIES[selectedType].label}</p>
                          {thought && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">&ldquo;{thought}&rdquo;</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
                            {locationName && <span>📍 {locationName}</span>}
                            {timeOption && (
                              <span>📅 {dateLabel} at {timeOption}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation hints */}
                  {!isValid && (
                    <p className="text-xs text-orange-500 text-center">
                      {!thought.trim()
                        ? 'Add a thought to help others connect with you'
                        : !locationName.trim()
                          ? 'Add a location so others can find you'
                          : !timeOption
                            ? 'Pick a time'
                            : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sticky submit button */}
            {step === 'details' && (
              <div className="shrink-0 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <button
                  onClick={handleCreate}
                  disabled={!isValid || creating}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                    isValid && !creating
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  {creating ? 'Creating...' : 'Start Wave 🙋'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
