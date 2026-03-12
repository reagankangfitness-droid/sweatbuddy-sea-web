'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentModalProps {
  session: {
    id: string
    title: string
    price: number
    currency: string
    acceptPayNow: boolean
    acceptStripe: boolean
    paynowQrImageUrl?: string | null
    paynowName?: string | null
    paynowPhoneNumber?: string | null
  }
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ session, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'PAYNOW' | 'STRIPE' | null>(
    session.acceptPayNow && !session.acceptStripe ? 'PAYNOW'
    : session.acceptStripe && !session.acceptPayNow ? 'STRIPE'
    : null
  )
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const proofInputRef = useRef<HTMLInputElement>(null)

  const priceDisplay = `${session.currency} ${(session.price / 100).toFixed(0)}`

  async function handlePayNowSubmit() {
    if (!proofFile) return
    setSubmitting(true)
    try {
      // Upload proof image
      const fd = new FormData()
      fd.append('file', proofFile)
      const uploadRes = await fetch('/api/upload/payment-proof', { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        alert(err.error || 'Failed to upload proof')
        return
      }
      const { url: paymentProofUrl } = await uploadRes.json()

      // Submit join with payment info
      const res = await fetch(`/api/buddy/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'PAYNOW',
          paymentProofUrl,
          amountPaid: session.price,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to submit payment')
        return
      }

      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStripeCheckout() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'STRIPE', amountPaid: session.price }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (res.ok) {
        onSuccess()
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Payment proof submitted!</h3>
          <p className="text-sm text-neutral-400">
            The host will verify your payment and confirm your spot. Check back soon.
          </p>
          <Button
            variant="default"
            className="w-full"
            onClick={() => { onSuccess(); onClose() }}
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-white">Complete payment</h2>
            <p className="text-xs text-neutral-400 mt-0.5">{session.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Price */}
          <div className="flex items-center justify-between rounded-xl bg-neutral-800 px-4 py-3">
            <span className="text-sm text-neutral-300">Amount due</span>
            <span className="text-lg font-bold text-white">{priceDisplay}</span>
          </div>

          {/* Method selector — only shown if both methods available */}
          {session.acceptPayNow && session.acceptStripe && (
            <div>
              <p className="text-xs font-medium text-neutral-400 mb-3">Pay with</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedMethod('PAYNOW')}
                  className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                    selectedMethod === 'PAYNOW'
                      ? 'border-white bg-white/10 text-white'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  PayNow
                </button>
                <button
                  onClick={() => setSelectedMethod('STRIPE')}
                  className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                    selectedMethod === 'STRIPE'
                      ? 'border-white bg-white/10 text-white'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  Card / Stripe
                </button>
              </div>
            </div>
          )}

          {/* PayNow flow */}
          {selectedMethod === 'PAYNOW' && (
            <div className="space-y-4">
              {/* QR code */}
              {session.paynowQrImageUrl && (
                <div className="flex flex-col items-center gap-2">
                  {session.paynowName && (
                    <p className="text-sm text-neutral-300">
                      Pay to: <span className="font-semibold text-white">{session.paynowName}</span>
                      {session.paynowPhoneNumber && (
                        <span className="text-neutral-500"> · {session.paynowPhoneNumber}</span>
                      )}
                    </p>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={session.paynowQrImageUrl}
                    alt="PayNow QR code"
                    className="w-40 h-40 object-contain rounded-xl bg-white p-2"
                  />
                </div>
              )}

              {/* Steps */}
              <ol className="space-y-1.5 text-xs text-neutral-400">
                <li className="flex gap-2"><span className="text-neutral-500">1.</span> Open your banking app and scan the QR code above</li>
                <li className="flex gap-2"><span className="text-neutral-500">2.</span> Transfer exactly <span className="text-white font-medium">{priceDisplay}</span></li>
                <li className="flex gap-2"><span className="text-neutral-500">3.</span> Screenshot the confirmation and upload below</li>
              </ol>

              {/* Proof upload */}
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">Upload payment screenshot <span className="text-red-400">*</span></p>
                {proofPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPreview}
                      alt="Payment proof"
                      className="w-full h-36 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => { setProofFile(null); setProofPreview(null) }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-neutral-800 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="flex items-center gap-2 w-full justify-center rounded-xl border border-dashed border-neutral-600 py-6 text-sm text-neutral-500 hover:border-neutral-400 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload screenshot
                  </button>
                )}
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setProofFile(file)
                    setProofPreview(URL.createObjectURL(file))
                  }}
                />
              </div>

              <Button
                variant="default"
                className="w-full"
                disabled={!proofFile || submitting}
                onClick={handlePayNowSubmit}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  'Submit payment proof'
                )}
              </Button>
            </div>
          )}

          {/* Stripe flow */}
          {selectedMethod === 'STRIPE' && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-400">
                You&apos;ll be redirected to a secure checkout page to complete payment by card.
              </p>
              <Button
                variant="default"
                className="w-full"
                disabled={submitting}
                onClick={handleStripeCheckout}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redirecting...</>
                ) : (
                  `Pay ${priceDisplay} →`
                )}
              </Button>
            </div>
          )}

          {/* No method selected yet */}
          {!selectedMethod && session.acceptPayNow && session.acceptStripe && (
            <p className="text-sm text-neutral-500 text-center">Select a payment method above</p>
          )}
        </div>
      </div>
    </div>
  )
}
