'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft } from 'lucide-react'
import { WAVE_ACTIVITIES, WAVE_ACTIVITY_TYPES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

interface CreateWaveSheetProps {
  isOpen: boolean
  onClose: () => void
  onCreateWave: (data: {
    activityType: WaveActivityType
    area: string
    locationName?: string
    latitude?: number
    longitude?: number
    scheduledFor?: string
  }) => Promise<void>
  userPosition: { lat: number; lng: number } | null
}

type Step = 'activity' | 'details'

export function CreateWaveSheet({ isOpen, onClose, onCreateWave, userPosition }: CreateWaveSheetProps) {
  const [step, setStep] = useState<Step>('activity')
  const [selectedType, setSelectedType] = useState<WaveActivityType | null>(null)
  const [area, setArea] = useState('')
  const [locationName, setLocationName] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [scheduledForInput, setScheduledForInput] = useState('')
  const [timePreset, setTimePreset] = useState<'now' | 'later' | 'pick' | null>(null)
  const [creating, setCreating] = useState(false)

  const reset = () => {
    setStep('activity')
    setSelectedType(null)
    setArea('')
    setLocationName('')
    setScheduledFor('')
    setScheduledForInput('')
    setTimePreset(null)
    setCreating(false)
  }

  const handleClose = () => {
    onClose()
    reset()
  }

  const handleSelectActivity = (type: WaveActivityType) => {
    setSelectedType(type)
    setStep('details')
  }

  const handleCreate = async () => {
    if (!selectedType || !area.trim()) return
    setCreating(true)
    try {
      await onCreateWave({
        activityType: selectedType,
        area: area.trim(),
        locationName: locationName.trim() || undefined,
        latitude: userPosition?.lat,
        longitude: userPosition?.lng,
        scheduledFor: scheduledFor || undefined,
      })
      handleClose()
    } catch {
      setCreating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <motion.div
            className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[80dvh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
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

            <div className="px-4 pb-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
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
              {step === 'details' && (
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Area *
                    </label>
                    <input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Marina Bay, Tanjong Pagar"
                      maxLength={200}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Location name (optional)
                    </label>
                    <input
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Gardens by the Bay"
                      maxLength={300}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      When? (optional)
                    </label>
                    <div className="flex gap-2 mb-2">
                      {[
                        { label: 'Now', value: 'now' },
                        { label: 'Later today', value: 'later' },
                        { label: 'Pick time', value: 'pick' },
                      ].map((opt) => {
                        const isSelected =
                          (opt.value === 'now' && timePreset === 'now') ||
                          (opt.value === 'later' && timePreset === 'later') ||
                          (opt.value === 'pick' && timePreset === 'pick')
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setTimePreset(opt.value as 'now' | 'later' | 'pick')
                              if (opt.value === 'now') {
                                setScheduledFor(new Date().toISOString())
                              } else if (opt.value === 'later') {
                                const later = new Date()
                                later.setHours(later.getHours() + 3)
                                setScheduledFor(later.toISOString())
                              } else {
                                setScheduledFor('')
                              }
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {timePreset === 'pick' && (
                      <input
                        type="datetime-local"
                        value={scheduledForInput}
                        onChange={(e) => {
                          setScheduledForInput(e.target.value)
                          setScheduledFor(e.target.value ? new Date(e.target.value).toISOString() : '')
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                      />
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Sticky submit button */}
            {step === 'details' && (
              <div className="shrink-0 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <button
                  onClick={handleCreate}
                  disabled={!area.trim() || creating}
                  className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Start Wave 🌊'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
