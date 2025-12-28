'use client'

import { useState, useMemo } from 'react'
import { X, Loader2, ChevronLeft } from 'lucide-react'

// Platform fee percentage
const PLATFORM_FEE_PERCENT = 5

interface PaymentModalProps {
  event: {
    id: string
    name: string
    price: number
    stripeEnabled?: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ event, onClose }: PaymentModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Calculate fees
  const fees = useMemo(() => {
    const basePrice = event.price // in cents
    const platformFee = Math.round(basePrice * (PLATFORM_FEE_PERCENT / 100))
    const total = basePrice + platformFee
    return {
      basePrice,
      platformFee,
      total,
      basePriceFormatted: (basePrice / 100).toFixed(2),
      platformFeeFormatted: (platformFee / 100).toFixed(2),
      totalFormatted: (total / 100).toFixed(2),
    }
  }, [event.price])

  const handleStripeCheckout = async () => {
    if (!email) {
      setError('We need your email to save your spot')
      return
    }
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/stripe/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          attendeeEmail: email,
          attendeeName: name || email.split('@')[0],
          quantity: 1,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to create checkout')
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Join {event.name}
        </h2>

        {/* Price breakdown */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Ticket price</span>
            <span className="text-neutral-900">${fees.basePriceFormatted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Service fee ({PLATFORM_FEE_PERCENT}%)</span>
            <span className="text-neutral-900">${fees.platformFeeFormatted}</span>
          </div>
          <div className="border-t border-neutral-200 pt-2 flex justify-between font-semibold">
            <span className="text-neutral-900">Total</span>
            <span className="text-neutral-900">${fees.totalFormatted} SGD</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
          />
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
          />
        </div>

        {/* Stripe Checkout Button */}
        {event.stripeEnabled ? (
          <button
            onClick={handleStripeCheckout}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to checkout...</span>
              </>
            ) : (
              <>
                <span className="text-xl">💳</span>
                <span>Pay ${fees.totalFormatted} SGD</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-6 bg-neutral-50 rounded-xl">
            <p className="text-neutral-500">Payments not available for this event</p>
          </div>
        )}

        <p className="text-xs text-neutral-400 text-center mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  )
}
