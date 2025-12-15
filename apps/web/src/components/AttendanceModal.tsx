'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader2, Calendar } from 'lucide-react'

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    name: string
    day: string
    time: string
    location: string
    organizer?: string
  }
  onSuccess: () => void
  showMealPreference?: boolean // Show meal preference selector for specific events
}

export function AttendanceModal({ isOpen, onClose, event, onSuccess, showMealPreference = false }: AttendanceModalProps) {
  // Debug log
  console.log('[AttendanceModal] eventId:', event.id, 'showMealPreference:', showMealPreference)

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    subscribe: true,
    mealPreference: '',
  })
  const [error, setError] = useState('')

  // Mount check for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-fill from localStorage if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sweatbuddies_user')
      if (saved) {
        try {
          const { email, name } = JSON.parse(saved)
          setFormData((prev) => ({ ...prev, email: email || '', name: name || '' }))
        } catch (e) {
          // Invalid data, ignore
        }
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventName: event.name,
          email: formData.email,
          name: formData.name || null,
          subscribe: formData.subscribe,
          mealPreference: formData.mealPreference || null,
          timestamp: new Date().toISOString(),
          // Additional details for confirmation email
          eventDay: event.day,
          eventTime: event.time,
          eventLocation: event.location,
          organizerInstagram: event.organizer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Special case: if already registered, treat as success
        if (data.error?.includes('already registered')) {
          // Store in localStorage so they don't have to re-enter
          localStorage.setItem(
            'sweatbuddies_user',
            JSON.stringify({
              email: formData.email,
              name: formData.name,
            })
          )

          // Add to going list in localStorage
          const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
          if (!going.includes(event.id)) {
            localStorage.setItem('sweatbuddies_going', JSON.stringify([...going, event.id]))
          }

          setStep('success')
          onSuccess()
          return
        }
        throw new Error(data.error || 'Something went wrong')
      }

      setStep('success')
      onSuccess()

      // Store in localStorage so they don't have to re-enter
      localStorage.setItem(
        'sweatbuddies_user',
        JSON.stringify({
          email: formData.email,
          name: formData.name,
        })
      )

      // Add to going list in localStorage
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      if (!going.includes(event.id)) {
        localStorage.setItem('sweatbuddies_going', JSON.stringify([...going, event.id]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setError('')
    onClose()
  }

  // Generate Google Calendar URL
  const generateCalendarUrl = () => {
    const title = encodeURIComponent(event.name)
    const location = encodeURIComponent(event.location)
    const details = encodeURIComponent(`Event from SweatBuddies - ${event.location}\n\n${event.day} at ${event.time}`)

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&details=${details}`
  }

  // Don't render on server or before mount
  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#2563EB] to-[#38BDF8] p-6 text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="pr-8">
                <p className="text-white/80 text-sm mb-1">You&apos;re joining</p>
                <h3 className="text-xl font-bold">{event.name}</h3>
                <p className="text-white/80 text-sm mt-2">
                  {event.day} &middot; {event.time} &middot; {event.location}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-4">
                      Drop your email to confirm your spot and get a reminder before the event.
                    </p>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Name Field (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="What should we call you?"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Meal Preference (Only for specific events) */}
                  {showMealPreference && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Preference *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'vegetarian', label: '🥗 Vegetarian', emoji: '🥗' },
                          { value: 'chicken', label: '🍗 Chicken', emoji: '🍗' },
                          { value: 'beef', label: '🥩 Beef', emoji: '🥩' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, mealPreference: option.value })}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              formData.mealPreference === option.value
                                ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-xl block mb-1">{option.emoji}</span>
                            <span className="text-xs font-medium">{option.value.charAt(0).toUpperCase() + option.value.slice(1)}</span>
                          </button>
                        ))}
                      </div>
                      {!formData.mealPreference && (
                        <p className="text-xs text-gray-500 mt-1">Please select your meal preference</p>
                      )}
                    </div>
                  )}

                  {/* Newsletter Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subscribe}
                      onChange={(e) => setFormData({ ...formData, subscribe: e.target.checked })}
                      className="mt-1 w-4 h-4 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                    />
                    <span className="text-sm text-gray-600">
                      Send me the weekly drop — the best events in Singapore, every Wednesday.
                    </span>
                  </label>

                  {/* Error Message - with special handling for already registered */}
                  {error && (
                    error.includes('already registered') ? (
                      <p className="text-amber-600 text-sm">You&apos;ve already registered for this event</p>
                    ) : (
                      <p className="text-red-500 text-sm">{error}</p>
                    )
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || (showMealPreference && !formData.mealPreference)}
                    className="w-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] hover:opacity-90 text-white py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <span>&#128587;</span>
                        Confirm I&apos;m Going
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    We&apos;ll only email you about this event and our weekly newsletter.
                  </p>
                </form>
              ) : (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h3>
                  <p className="text-gray-600 mb-6">
                    We&apos;ll send you a reminder before {event.name}.
                  </p>

                  {/* Add to Calendar */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const calendarUrl = generateCalendarUrl()
                        window.open(calendarUrl, '_blank')
                      }}
                      className="w-full py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Add to Calendar
                    </button>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 text-gray-500 hover:text-gray-700 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body)
}
