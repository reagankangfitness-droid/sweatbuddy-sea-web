'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface Preferences {
  city: string
  categories: string[]
  timePreference: string
  completedAt: string
}

const CATEGORIES = [
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'hiit', label: 'HIIT', emoji: '🔥' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { id: 'combat', label: 'Combat', emoji: '🥊' },
]

const TIME_PREFERENCES = [
  { id: 'early', label: 'Early Bird', subtitle: 'Before 8am' },
  { id: 'lunch', label: 'Lunch Break', subtitle: '11am - 2pm' },
  { id: 'evening', label: 'After Work', subtitle: '5pm - 8pm' },
  { id: 'weekend', label: 'Weekends', subtitle: 'Saturday & Sunday' },
]

export function OnboardingQuiz() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<Partial<Preferences>>({
    categories: [],
  })

  useEffect(() => {
    // Check if user has completed onboarding
    const saved = safeGetJSON<Preferences | null>('sweatbuddies_preferences', null)
    if (!saved) {
      // Show quiz after 2 seconds for first-time visitors
      const timer = setTimeout(() => setIsOpen(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    const finalPrefs: Preferences = {
      city: preferences.city || 'singapore',
      categories: preferences.categories || [],
      timePreference: preferences.timePreference || 'any',
      completedAt: new Date().toISOString(),
    }

    safeSetJSON('sweatbuddies_preferences', finalPrefs)
    setIsOpen(false)

    // Trigger page refresh or state update to apply preferences
    window.dispatchEvent(new Event('preferencesUpdated'))

    // Scroll to events section with smooth animation after a short delay
    setTimeout(() => {
      const eventsSection = document.getElementById('events')
      if (eventsSection) {
        eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }

  const toggleCategory = (categoryId: string) => {
    const current = preferences.categories || []
    if (current.includes(categoryId)) {
      setPreferences({
        ...preferences,
        categories: current.filter((c) => c !== categoryId),
      })
    } else if (current.length < 3) {
      setPreferences({
        ...preferences,
        categories: [...current, categoryId],
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-300 border border-[#e8eef5]" style={{ background: 'linear-gradient(135deg, #ffffff, #f7faff, #f0f4fa)' }}>
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#f0f4fa] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-[#5a6b7a]" />
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#3477f8]' : 'bg-[#e0e7ef]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: City */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-2xl font-bold text-[#0d1520]">
                Welcome to SweatBuddies 👋
              </h2>
              <p className="font-sans text-[#5a6b7a] mt-2">
                Let&apos;s personalize your experience. Where are you based?
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'singapore', label: 'Singapore 🇸🇬', active: true },
                { id: 'kuala-lumpur', label: 'Kuala Lumpur 🇲🇾', active: false },
                { id: 'bangkok', label: 'Bangkok 🇹🇭', active: false },
              ].map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    if (city.active) {
                      setPreferences({ ...preferences, city: city.id })
                      setStep(2)
                    }
                  }}
                  disabled={!city.active}
                  className={`w-full p-4 rounded-xl border text-left font-sans transition-all ${
                    city.active
                      ? 'hover:border-[#3477f8]/40 hover:bg-[#3477f8]/5 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  } ${
                    preferences.city === city.id
                      ? 'border-[#3477f8] bg-[#3477f8]/10'
                      : 'border-[#e0e7ef]'
                  }`}
                >
                  <span className="font-medium text-[#0d1520]">{city.label}</span>
                  {!city.active && (
                    <span className="text-xs text-[#a0b0c0] ml-2">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-2xl font-bold text-[#0d1520]">
                What gets you moving?
              </h2>
              <p className="font-sans text-[#5a6b7a] mt-2">
                Pick up to 3. We&apos;ll show you relevant events first.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-4 rounded-xl border text-center font-sans transition-all ${
                    preferences.categories?.includes(cat.id)
                      ? 'border-[#3477f8] bg-[#3477f8]/10'
                      : 'border-[#e0e7ef] hover:border-[#3477f8]/40'
                  }`}
                >
                  <span className="text-2xl block mb-1">{cat.emoji}</span>
                  <span className="text-sm text-[#0d1520]">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-sans font-semibold border border-[#e0e7ef] text-[#5a6b7a] hover:bg-[#f0f4fa] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#3477f8] text-white py-3 rounded-xl font-sans font-bold hover:bg-[#2563eb] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Time Preference */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-2xl font-bold text-[#0d1520]">
                When do you usually work out?
              </h2>
              <p className="font-sans text-[#5a6b7a] mt-2">
                We&apos;ll highlight sessions that fit your schedule.
              </p>
            </div>

            <div className="space-y-3">
              {TIME_PREFERENCES.map((time) => (
                <button
                  key={time.id}
                  onClick={() => {
                    setPreferences({ ...preferences, timePreference: time.id })
                  }}
                  className={`w-full p-4 rounded-xl border text-left font-sans transition-all ${
                    preferences.timePreference === time.id
                      ? 'border-[#3477f8] bg-[#3477f8]/10'
                      : 'border-[#e0e7ef] hover:border-[#3477f8]/40'
                  }`}
                >
                  <span className="font-medium block text-[#0d1520]">{time.label}</span>
                  <span className="text-sm text-[#5a6b7a]">
                    {time.subtitle}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl font-sans font-semibold border border-[#e0e7ef] text-[#5a6b7a] hover:bg-[#f0f4fa] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-[#3477f8] text-white py-3 rounded-xl font-sans font-bold hover:bg-[#2563eb] transition-colors"
              >
                Show Me Events
              </button>
            </div>
          </div>
        )}

        {/* Skip option */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full text-center text-sm text-[#a0b0c0] mt-4 hover:text-[#5a6b7a] hover:underline transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
