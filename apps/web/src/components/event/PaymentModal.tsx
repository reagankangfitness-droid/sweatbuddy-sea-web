'use client'

import { useState, useMemo } from 'react'
import { X, Loader2, Check, Copy } from 'lucide-react'
import Image from 'next/image'

interface PaymentModalProps {
  event: {
    id: string
    name: string
    price: number
    paynowEnabled?: boolean
    paynowQrCode?: string | null
    paynowNumber?: string | null
  }
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ event, onClose, onSuccess }: PaymentModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<'pay' | 'confirm'>('pay')

  // Calculate price (no platform fee for PayNow to keep it simple)
  const priceFormatted = useMemo(() => {
    return (event.price / 100).toFixed(2)
  }, [event.price])

  const copyNumber = async () => {
    if (event.paynowNumber) {
      await navigator.clipboard.writeText(event.paynowNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }
    if (!paymentReference || paymentReference.length < 4) {
      setError('Please enter your PayNow reference (at least 4 characters)')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/checkout/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventName: event.name,
          email,
          name: name || email.split('@')[0],
          paymentReference: paymentReference.toUpperCase(),
          amount: event.price,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment')
      }

      // Success - show confirmation and close
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  // Check if PayNow is properly configured
  if (!event.paynowEnabled || !event.paynowQrCode) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
          <div className="text-center py-8">
            <p className="text-neutral-500">Payments not available for this event</p>
          </div>
        </div>
      </div>
    )
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

        <h2 className="text-xl font-bold text-neutral-900 mb-1">
          Pay with PayNow
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          {event.name}
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'pay' ? (
          <>
            {/* Step 1: Scan QR */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-sm flex items-center justify-center font-semibold">1</span>
                <span className="font-medium text-neutral-900">Scan QR or transfer to</span>
              </div>

              <div className="flex flex-col items-center bg-neutral-50 rounded-xl p-4">
                {/* QR Code */}
                <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                  <Image
                    src={event.paynowQrCode}
                    alt="PayNow QR Code"
                    width={180}
                    height={180}
                    className="w-44 h-44 object-contain"
                  />
                </div>

                {/* Phone/UEN */}
                {event.paynowNumber && (
                  <button
                    onClick={copyNumber}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-neutral-900 font-mono font-medium">{event.paynowNumber}</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Amount */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-sm flex items-center justify-center font-semibold">2</span>
                <span className="font-medium text-neutral-900">Transfer this amount</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-neutral-900">${priceFormatted}</span>
                <span className="text-neutral-500 ml-1">SGD</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('confirm')}
              className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
            >
              I&apos;ve Made the Transfer
            </button>

            <p className="text-xs text-neutral-400 text-center mt-3">
              After transferring, click above to enter your details
            </p>
          </>
        ) : (
          <>
            {/* Step 3: Enter details */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-sm flex items-center justify-center font-semibold">3</span>
                <span className="font-medium text-neutral-900">Enter your details</span>
              </div>

              {/* Email */}
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

              {/* Name */}
              <div className="mb-3">
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

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  PayNow Reference *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                  placeholder="e.g., 20240115ABC123"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 font-mono uppercase"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Find this in your PayNow transfer confirmation
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Confirm Payment'
              )}
            </button>

            {/* Back button */}
            <button
              onClick={() => setStep('pay')}
              className="w-full py-3 text-neutral-500 text-sm hover:text-neutral-700 mt-2"
            >
              Back to payment instructions
            </button>

            <p className="text-xs text-neutral-400 text-center mt-3">
              The host will verify your payment and confirm your spot
            </p>
          </>
        )}
      </div>
    </div>
  )
}
