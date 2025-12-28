'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { Check } from 'lucide-react'
import { AttendanceModal } from './AttendanceModal'

// Lazy load PaymentModal to reduce bundle size
const PaymentModal = lazy(() => import('./event/PaymentModal').then(mod => ({ default: mod.PaymentModal })))

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
  eventDate?: string | null
  communityLink?: string | null
  initialCount?: number
  compact?: boolean
  fullWidth?: boolean
  onSuccess?: () => void
  isFull?: boolean
  // Pricing props
  isFree?: boolean
  price?: number | null // Amount in cents
  stripeEnabled?: boolean
}

export function GoingButton({
  eventId,
  eventName = 'Event',
  eventDay = '',
  eventTime = '',
  eventLocation = '',
  eventOrganizer = '',
  eventDate = null,
  communityLink = null,
  initialCount = 0,
  compact = false,
  fullWidth = false,
  onSuccess,
  isFull = false,
  // Pricing props
  isFree = true,
  price = null,
  stripeEnabled = false,
}: GoingButtonProps) {
  const [isGoing, setIsGoing] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Determine if this is a paid event
  const isPaidEvent = !isFree && price && price > 0 && stripeEnabled
  const formattedPrice = price ? (price / 100).toFixed(0) : '0'

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

    // Not going yet - show appropriate modal
    if (isPaidEvent) {
      setShowPaymentModal(true)
    } else {
      setShowModal(true)
    }
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
    // Show "Event Full" if event is full and user hasn't already RSVP'd
    if (isFull && !isGoing) {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed"
        >
          <span>Event Full</span>
          {count > 0 && (
            <span className="text-neutral-400 ml-1">• {count} attending</span>
          )}
        </button>
      )
    }

    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all ${
            isGoing
              ? 'bg-green-500 text-white'
              : isPaidEvent
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-700'
          } ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
        >
          {isGoing ? (
            <>
              <Check className="w-4 h-4" />
              <span>You&apos;re Going!</span>
            </>
          ) : isPaidEvent ? (
            <>
              <span>Join · ${formattedPrice}</span>
              {count > 0 && (
                <span className="text-white/70 ml-1">• {count} attending</span>
              )}
            </>
          ) : (
            <>
              <span>Count Me In</span>
              {count > 0 && (
                <span className="text-white/70 ml-1">• {count} going</span>
              )}
            </>
          )}
        </button>
        {!isGoing && !isPaidEvent && (
          <p className="text-xs text-neutral-400 mt-2 text-center">
            Free · No account needed · Just show up
          </p>
        )}

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
            eventDate: eventDate,
            communityLink: communityLink,
          }}
          onSuccess={handleSuccess}
          showMealPreference={checkMealPreference(eventId)}
        />

        {isPaidEvent && showPaymentModal && (
          <Suspense fallback={null}>
            <PaymentModal
              event={{
                id: eventId,
                name: eventName,
                price: price || 0,
                stripeEnabled,
              }}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handleSuccess}
            />
          </Suspense>
        )}
      </>
    )
  }

  // Compact button for card footer
  if (compact) {
    // Show "Full" if event is full and user hasn't already RSVP'd
    if (isFull && !isGoing) {
      return (
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed"
        >
          <span>Full</span>
        </button>
      )
    }

    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            isGoing
              ? 'bg-green-500 text-white'
              : isPaidEvent
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-700'
          } ${isAnimating ? 'scale-105' : 'scale-100'}`}
        >
          {isGoing && <Check className="w-3 h-3" />}
          <span>{isGoing ? 'Going' : isPaidEvent ? `$${formattedPrice}` : "Count Me In"}</span>
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
            eventDate: eventDate,
            communityLink: communityLink,
          }}
          onSuccess={handleSuccess}
          showMealPreference={checkMealPreference(eventId)}
        />

        {isPaidEvent && showPaymentModal && (
          <Suspense fallback={null}>
            <PaymentModal
              event={{
                id: eventId,
                name: eventName,
                price: price || 0,
                stripeEnabled,
              }}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handleSuccess}
            />
          </Suspense>
        )}
      </>
    )
  }

  // Default button
  // Show "Event Full" if event is full and user hasn't already RSVP'd
  if (isFull && !isGoing) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed"
      >
        <span>Event Full</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
          isGoing
            ? 'bg-green-500 text-white'
            : isPaidEvent
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-neutral-900 text-white hover:bg-neutral-700'
        } ${isAnimating ? 'scale-105' : 'scale-100'}`}
      >
        {isGoing && <Check className="w-4 h-4" />}
        <span>{isGoing ? "You're Going!" : isPaidEvent ? `Join · $${formattedPrice}` : "Count Me In"}</span>
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
          eventDate: eventDate,
          communityLink: communityLink,
        }}
        onSuccess={handleSuccess}
        showMealPreference={checkMealPreference(eventId)}
      />

      {isPaidEvent && showPaymentModal && (
        <Suspense fallback={null}>
          <PaymentModal
            event={{
              id: eventId,
              name: eventName,
              price: price || 0,
              stripeEnabled,
            }}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handleSuccess}
          />
        </Suspense>
      )}
    </>
  )
}
