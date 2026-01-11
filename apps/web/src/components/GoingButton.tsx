'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

// Lazy load PaymentModal to reduce bundle size
const PaymentModal = lazy(() => import('./event/PaymentModal').then(mod => ({ default: mod.PaymentModal })))

interface GoingButtonProps {
  eventId: string
  eventName?: string
  eventSlug?: string | null
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
  price?: number | null
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
}

export function GoingButton({
  eventId,
  eventName = 'Event',
  eventSlug = null,
  eventDay = '',
  eventTime = '',
  eventLocation = '',
  eventDate = null,
  initialCount = 0,
  compact = false,
  fullWidth = false,
  onSuccess,
  isFull = false,
  isFree = true,
  price = null,
  paynowEnabled = false,
  paynowQrCode = null,
  paynowNumber = null,
}: GoingButtonProps) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  const [isGoing, setIsGoing] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // An event is paid if it has a price > 0 (regardless of isFree flag)
  const hasPaidPrice = price && price > 0
  // PayNow flow is available only if paynowEnabled and has QR code
  const hasPaymentMethod = paynowEnabled && paynowQrCode
  // Show paid button if event has a price
  const isPaidEvent = hasPaidPrice
  const formattedPrice = price ? (price / 100).toFixed(0) : '0'

  useEffect(() => {
    const going = safeGetJSON<string[]>('sweatbuddies_going', [])
    setIsGoing(going.includes(eventId))
  }, [eventId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If already going, allow toggle off without auth check
    if (isGoing) {
      // Toggle off
      const going = safeGetJSON<string[]>('sweatbuddies_going', [])
      const newGoing = going.filter((id: string) => id !== eventId)
      safeSetJSON('sweatbuddies_going', newGoing)
      setIsGoing(false)
      setCount(Math.max(0, count - 1))
      return
    }

    // Require authentication for new RSVPs
    if (isLoaded && !isSignedIn) {
      // Build redirect URL - use slug if available, otherwise eventId
      const eventPath = eventSlug || eventId
      const redirectUrl = `/e/${eventPath}`

      // Store intent for post-login
      sessionStorage.setItem('auth_intent', JSON.stringify({
        intent: 'rsvp',
        eventId,
        eventSlug,
        timestamp: Date.now()
      }))

      router.push(`/sign-in?intent=rsvp&eventSlug=${eventPath}&redirect_url=${encodeURIComponent(redirectUrl)}`)
      return
    }

    // Paid event - show payment modal or error if no payment method
    if (isPaidEvent) {
      if (!hasPaymentMethod) {
        toast.error('Payment not yet set up. Contact the host to join.', {
          duration: 4000,
        })
        return
      }
      setShowPaymentModal(true)
      return
    }

    // FREE EVENT: One-tap RSVP (user is authenticated at this point)
    const going = safeGetJSON<string[]>('sweatbuddies_going', [])
    if (!going.includes(eventId)) {
      safeSetJSON('sweatbuddies_going', [...going, eventId])
    }

    // Also add to saved events for easy access later
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
    if (!saved.includes(eventId)) {
      safeSetJSON('sweatbuddies_saved', [...saved, eventId])
      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('savedEventsUpdated'))
    }

    setIsGoing(true)
    setCount(count + 1)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    toast.success("You're in! See you there.", {
      duration: 3000,
    })

    onSuccess?.()
  }

  const handlePaymentSuccess = () => {
    // Add to going list
    const going = safeGetJSON<string[]>('sweatbuddies_going', [])
    if (!going.includes(eventId)) {
      safeSetJSON('sweatbuddies_going', [...going, eventId])
    }

    // Also add to saved events for easy access later
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
    if (!saved.includes(eventId)) {
      safeSetJSON('sweatbuddies_saved', [...saved, eventId])
      window.dispatchEvent(new CustomEvent('savedEventsUpdated'))
    }

    setIsGoing(true)
    setCount(count + 1)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    onSuccess?.()
  }

  // WhatsApp share function
  const handleWhatsAppShare = () => {
    const eventUrl = eventSlug
      ? `https://sweatbuddies.co/e/${eventSlug}`
      : `https://sweatbuddies.co/?event=${eventId}`

    const dateStr = eventDate
      ? new Date(eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : eventDay

    const message = `I'm going to ${eventName} on ${dateStr} at ${eventTime}. Join me?\n\n${eventUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // WhatsApp share prompt component
  const SharePrompt = () => {
    if (!isGoing) return null

    return (
      <div className="mt-3 p-3 bg-neutral-50 rounded-xl">
        <p className="text-sm text-neutral-600 mb-2">Bring a friend?</p>
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-lg hover:bg-[#22c55e] transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Share on WhatsApp
        </button>
      </div>
    )
  }

  // Full width button
  if (fullWidth) {
    if (isFull && !isGoing) {
      return (
        <button disabled className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed">
          <span>Event Full</span>
          {count > 0 && <span className="text-neutral-400 ml-1">• {count} going</span>}
        </button>
      )
    }

    return (
      <div>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            isGoing
              ? 'bg-green-500 text-white'
              : isPaidEvent
              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          } ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
        >
          {isGoing ? (
            <>
              <Check className="w-4 h-4" />
              <span>You&apos;re in!</span>
            </>
          ) : isPaidEvent ? (
            <>
              <span>Join · ${formattedPrice}</span>
              {count > 0 && <span className="text-white/70 ml-1">• {count} going</span>}
            </>
          ) : (
            <>
              <span>I&apos;m Going</span>
              {count > 0 && <span className="text-white/70 ml-1">• {count} going</span>}
            </>
          )}
        </button>

        {!isGoing && !isPaidEvent && (
          <p className="text-xs text-neutral-400 mt-2 text-center">
            Free event
          </p>
        )}

        <SharePrompt />

        {isPaidEvent && hasPaymentMethod && showPaymentModal && (
          <Suspense fallback={null}>
            <PaymentModal
              event={{
                id: eventId,
                name: eventName,
                price: price || 0,
                paynowEnabled,
                paynowQrCode,
                paynowNumber,
              }}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handlePaymentSuccess}
            />
          </Suspense>
        )}
      </div>
    )
  }

  // Compact button
  if (compact) {
    if (isFull && !isGoing) {
      return (
        <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed">
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
              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          } ${isAnimating ? 'scale-105' : 'scale-100'}`}
        >
          {isGoing && <Check className="w-3 h-3" />}
          <span>{isGoing ? "You're in!" : isPaidEvent ? `$${formattedPrice}` : "I'm In"}</span>
          {count > 0 && !isGoing && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {count}
            </span>
          )}
        </button>

        {isPaidEvent && hasPaymentMethod && showPaymentModal && (
          <Suspense fallback={null}>
            <PaymentModal
              event={{
                id: eventId,
                name: eventName,
                price: price || 0,
                paynowEnabled,
                paynowQrCode,
                paynowNumber,
              }}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handlePaymentSuccess}
            />
          </Suspense>
        )}
      </>
    )
  }

  // Default button
  if (isFull && !isGoing) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-neutral-200 text-neutral-500 cursor-not-allowed">
        <span>Event Full</span>
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isGoing
            ? 'bg-green-500 text-white'
            : isPaidEvent
            ? 'bg-neutral-800 text-white hover:bg-neutral-700'
            : 'bg-neutral-900 text-white hover:bg-neutral-800'
        } ${isAnimating ? 'scale-105' : 'scale-100'}`}
      >
        {isGoing && <Check className="w-4 h-4" />}
        <span>{isGoing ? "You're in!" : isPaidEvent ? `Join · $${formattedPrice}` : "I'm Going"}</span>
        {count > 0 && !isGoing && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
            {count}
          </span>
        )}
      </button>

      <SharePrompt />

      {isPaidEvent && hasPaymentMethod && showPaymentModal && (
        <Suspense fallback={null}>
          <PaymentModal
            event={{
              id: eventId,
              name: eventName,
              price: price || 0,
              paynowEnabled,
              paynowQrCode,
              paynowNumber,
            }}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        </Suspense>
      )}
    </div>
  )
}
