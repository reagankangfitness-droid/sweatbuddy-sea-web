'use client'

import { useState } from 'react'
import { X, Loader2, Check, ChevronLeft } from 'lucide-react'

interface PaymentModalProps {
  event: {
    id: string
    name: string
    price: number
    paynowEnabled?: boolean
    paynowQrCode?: string | null
    paynowNumber?: string | null
    paynowName?: string | null
    stripeEnabled?: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

type PaymentStep = 'select' | 'paynow' | 'paynow-confirm' | 'processing' | 'success'

export function PaymentModal({ event, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('select')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const formattedPrice = (event.price / 100).toFixed(2)

  const handlePaynowSubmit = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }
    if (!transactionRef || transactionRef.length < 4) {
      setError('Please enter the last 4 characters of your transaction reference')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/checkout/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventName: event.name,
          email,
          name,
          transactionRef,
          amount: event.price,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit payment')
      }

      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
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

        {/* Step: Select Payment Method */}
        {step === 'select' && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Join {event.name}
            </h2>
            <p className="text-neutral-500 mb-6">
              Total: <span className="font-semibold text-neutral-900">${formattedPrice} SGD</span>
            </p>

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
            <div className="mb-4">
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

            <p className="text-sm font-medium text-neutral-700 mb-3">Payment method</p>

            <div className="space-y-3">
              {/* PayNow Option */}
              {event.paynowEnabled && (
                <button
                  onClick={() => {
                    if (!email) {
                      setError('Please enter your email')
                      return
                    }
                    setError('')
                    setStep('paynow')
                  }}
                  className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PayNow</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">PayNow</p>
                    <p className="text-sm text-neutral-500">Bank transfer via QR code</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-neutral-400 rotate-180" />
                </button>
              )}

              {/* Card payments - Coming Soon */}
              <div className="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl bg-neutral-50 opacity-60">
                <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-500">Card payments</p>
                    <span className="px-2 py-0.5 bg-neutral-200 text-neutral-500 text-xs rounded-full font-medium">Coming Soon</span>
                  </div>
                  <p className="text-sm text-neutral-400">Visa, Mastercard, Amex</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: PayNow Instructions */}
        {step === 'paynow' && (
          <div>
            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Pay with PayNow
            </h2>
            <p className="text-neutral-500 mb-6">
              Transfer <span className="font-semibold text-neutral-900">${formattedPrice} SGD</span>
            </p>

            {/* QR Code */}
            {event.paynowQrCode && (
              <div className="bg-neutral-50 rounded-xl p-6 mb-4 text-center">
                <img
                  src={event.paynowQrCode}
                  alt="PayNow QR Code"
                  className="w-48 h-48 mx-auto mb-3 object-contain"
                />
                <p className="text-sm text-neutral-500">Scan with your banking app</p>
              </div>
            )}

            {/* PayNow Details */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6 space-y-2 border border-purple-100">
              {event.paynowName && (
                <div className="flex justify-between">
                  <span className="text-purple-700">PayNow to:</span>
                  <span className="font-medium text-purple-900">{event.paynowName}</span>
                </div>
              )}
              {event.paynowNumber && (
                <div className="flex justify-between">
                  <span className="text-purple-700">Number:</span>
                  <span className="font-mono font-medium text-purple-900">{event.paynowNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-purple-700">Amount:</span>
                <span className="font-medium text-purple-900">${formattedPrice} SGD</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-700 mb-2">How to pay:</p>
              <ol className="text-sm text-neutral-600 space-y-1 list-decimal list-inside">
                <li>Open your banking app (DBS, OCBC, UOB, etc.)</li>
                <li>Scan the QR code or enter PayNow number</li>
                <li>Transfer exactly ${formattedPrice}</li>
                <li>Note the transaction reference</li>
              </ol>
            </div>

            <button
              onClick={() => setStep('paynow-confirm')}
              className="w-full py-3.5 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              I&apos;ve made the payment
            </button>
          </div>
        )}

        {/* Step: PayNow Confirmation */}
        {step === 'paynow-confirm' && (
          <div>
            <button
              onClick={() => setStep('paynow')}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Confirm your payment
            </h2>
            <p className="text-neutral-500 mb-6">
              Enter the last 4 characters of your transaction reference
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Transaction Reference */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Last 4 characters of transaction reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value.toUpperCase())}
                placeholder="e.g. AB12"
                maxLength={6}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-center text-lg font-mono tracking-widest focus:outline-none focus:border-neutral-900"
              />
              <p className="text-xs text-neutral-400 mt-2">
                Find this in your bank&apos;s transaction confirmation
              </p>
            </div>

            <button
              onClick={handlePaynowSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit for verification'
              )}
            </button>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-neutral-400 mb-4" />
            <p className="text-neutral-600">Processing...</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Payment submitted!
            </h2>
            <p className="text-neutral-500 mb-6">
              The host will verify your payment and confirm your spot. You&apos;ll receive an email once confirmed.
            </p>
            <button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="px-6 py-3 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
