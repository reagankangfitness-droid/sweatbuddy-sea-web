'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { AttendanceModal } from './AttendanceModal'

// Event IDs that require meal preference selection
const EVENTS_WITH_MEAL_PREFERENCE = [
  'submission-cmiret3560000102pol6s3pyj', // Specific event that needs meal choice
]

// Debug helper
const checkMealPreference = (eventId: string) => {
  const result = EVENTS_WITH_MEAL_PREFERENCE.includes(eventId)
  console.log('[GoingButton] eventId:', eventId, 'needsMealPref:', result)
  return result
}

interface GoingButtonProps {
  eventId: string
  eventName?: string
  eventDay?: string
  eventTime?: string
  eventLocation?: string
  eventOrganizer?: string
  initialCount?: number
  compact?: boolean
  fullWidth?: boolean
  onSuccess?: () => void
}

export function GoingButton({
  eventId,
  eventName = 'Event',
  eventDay = '',
  eventTime = '',
  eventLocation = '',
  eventOrganizer = '',
  initialCount = 0,
  compact = false,
  fullWidth = false,
  onSuccess
}: GoingButtonProps) {
  const [isGoing, setIsGoing] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      setIsGoing(going.includes(eventId))
    }
  }, [eventId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isGoing) {
      // Already going - toggle off
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      const newGoing = going.filter((id: string) => id !== eventId)
      localStorage.setItem('sweatbuddies_going', JSON.stringify(newGoing))
      setIsGoing(false)
      setCount(Math.max(0, count - 1))
      return
    }

    // Not going yet - show modal for email collection
    setShowModal(true)
  }

  const handleSuccess = () => {
    setIsGoing(true)
    setCount(count + 1)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    onSuccess?.()
  }

  // Full width button for back of card
  if (fullWidth) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-heading font-semibold transition-all ${
            isGoing
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-gradient-to-r from-[#1800ad] to-[#4A3DE6] text-white hover:opacity-90'
          } ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
        >
          {isGoing ? (
            <>
              <Check className="w-4 h-4" />
              <span>You&apos;re Going!</span>
            </>
          ) : (
            <>
              <span className="text-base">🙋</span>
              <span>I&apos;m Going</span>
              {count > 0 && (
                <span className="text-white/80 ml-1">• {count} attending</span>
              )}
            </>
          )}
        </button>

        <AttendanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          event={{
            id: eventId,
            name: eventName,
            day: eventDay,
            time: eventTime,
            location: eventLocation,
            organizer: eventOrganizer,
          }}
          onSuccess={handleSuccess}
          showMealPreference={checkMealPreference(eventId)}
        />
      </>
    )
  }

  // Compact button for card footer
  if (compact) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all ${
            isGoing
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white hover:opacity-90'
          } ${isAnimating ? 'scale-105' : 'scale-100'}`}
        >
          {isGoing ? (
            <Check className="w-3 h-3" />
          ) : (
            <span className="text-sm">🙋</span>
          )}
          <span>{isGoing ? 'Going' : "I'm Going"}</span>
          {count > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isGoing ? 'bg-white/20' : 'bg-white/20'
              }`}
            >
              {count}
            </span>
          )}
        </button>

        <AttendanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          event={{
            id: eventId,
            name: eventName,
            day: eventDay,
            time: eventTime,
            location: eventLocation,
            organizer: eventOrganizer,
          }}
          onSuccess={handleSuccess}
          showMealPreference={checkMealPreference(eventId)}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all ${
          isGoing
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
            : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white hover:opacity-90'
        } ${isAnimating ? 'scale-105' : 'scale-100'}`}
      >
        {isGoing ? (
          <Check className="w-4 h-4" />
        ) : (
          <span className="text-base">&#128587;</span>
        )}
        <span>{isGoing ? "I'm Going!" : "I'm Going"}</span>
        {count > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              isGoing ? 'bg-white/20' : 'bg-white/20'
            }`}
          >
            {count}
          </span>
        )}
      </button>

      <AttendanceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        event={{
          id: eventId,
          name: eventName,
          day: eventDay,
          time: eventTime,
          location: eventLocation,
          organizer: eventOrganizer,
        }}
        onSuccess={handleSuccess}
        showMealPreference={checkMealPreference(eventId)}
      />
    </>
  )
}
