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
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17130E]/42 p-4 sm:items-center">
        <div className="w-full max-w-md space-y-4 rounded-lg border-2 border-[#17130E] bg-[#F4EFE3] p-6 text-center text-[#17130E] shadow-[4px_4px_0_#17130E]">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#17130E]">Payment proof submitted!</h3>
          <p className="text-sm text-[#17130E]/62">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17130E]/42 p-4 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-[#17130E] bg-[#F4EFE3] text-[#17130E] shadow-[4px_4px_0_#17130E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#17130E] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#17130E]">Complete payment</h2>
            <p className="mt-0.5 text-xs text-[#17130E]/62">{session.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border-2 border-[#17130E] bg-[#F8F4EA] p-1.5 text-[#17130E] shadow-[2px_2px_0_#17130E] transition-colors hover:bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Price */}
          <div className="flex items-center justify-between rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-4 py-3">
            <span className="text-sm text-[#17130E]/62">Amount due</span>
            <span className="text-lg font-bold text-[#17130E]">{priceDisplay}</span>
          </div>

          {/* Method selector — only shown if both methods available */}
          {session.acceptPayNow && session.acceptStripe && (
            <div>
              <p className="mb-3 text-xs font-medium text-[#17130E]/62">Pay with</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedMethod('PAYNOW')}
                  className={`rounded-md border-2 p-3 text-sm font-medium transition-colors ${
                    selectedMethod === 'PAYNOW'
                      ? 'border-[#17130E] bg-[#0B4BA8] text-white'
                      : 'border-[#17130E]/18 bg-[#F8F4EA] text-[#17130E] hover:border-[#17130E]'
                  }`}
                >
                  PayNow
                </button>
                <button
                  onClick={() => setSelectedMethod('STRIPE')}
                  className={`rounded-md border-2 p-3 text-sm font-medium transition-colors ${
                    selectedMethod === 'STRIPE'
                      ? 'border-[#17130E] bg-[#0B4BA8] text-white'
                      : 'border-[#17130E]/18 bg-[#F8F4EA] text-[#17130E] hover:border-[#17130E]'
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
                    <p className="text-sm text-[#17130E]/72">
                      Pay to: <span className="font-semibold text-[#17130E]">{session.paynowName}</span>
                      {session.paynowPhoneNumber && (
                        <span className="text-[#17130E]/52"> · {session.paynowPhoneNumber}</span>
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
              <ol className="space-y-1.5 text-xs text-[#17130E]/62">
                <li className="flex gap-2"><span className="text-[#17130E]/42">1.</span> Open your banking app and scan the QR code above</li>
                <li className="flex gap-2"><span className="text-[#17130E]/42">2.</span> Transfer exactly <span className="font-medium text-[#17130E]">{priceDisplay}</span></li>
                <li className="flex gap-2"><span className="text-[#17130E]/42">3.</span> Screenshot the confirmation and upload below</li>
              </ol>

              {/* Proof upload */}
              <div>
                <p className="mb-2 text-xs font-medium text-[#17130E]/62">Upload payment screenshot <span className="text-red-600">*</span></p>
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
                      className="absolute right-2 top-2 rounded-md border-2 border-[#17130E] bg-[#F8F4EA] p-1 text-[#17130E]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#17130E]/32 bg-[#F8F4EA] py-6 text-sm text-[#17130E]/62 transition-colors hover:border-[#17130E]"
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
              <p className="text-sm text-[#17130E]/62">
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
            <p className="text-center text-sm text-[#17130E]/52">Select a payment method above</p>
          )}
        </div>
      </div>
    </div>
  )
}
