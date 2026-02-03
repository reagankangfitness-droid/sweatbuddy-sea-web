'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface SessionDetails {
  status: string
  customerEmail?: string
  amountTotal?: number
  currency?: string
}

export function PaymentStatus() {
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const sessionId = searchParams.get('session_id')

  const [details, setDetails] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSessionDetails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stripe/checkout/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setDetails(data)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId && paymentStatus === 'success') {
      fetchSessionDetails()
    }
  }, [sessionId, paymentStatus, fetchSessionDetails])

  // Payment Success
  if (paymentStatus === 'success') {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">Payment successful!</p>
            {loading ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                <span className="text-sm text-green-600">Loading details...</span>
              </div>
            ) : details?.customerEmail ? (
              <p className="text-sm text-green-700 mt-1">
                Confirmation sent to <strong>{details.customerEmail}</strong>
              </p>
            ) : (
              <p className="text-sm text-green-700 mt-1">
                Your ticket is confirmed. Check your email for details.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Payment Cancelled
  if (paymentStatus === 'cancelled') {
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Payment cancelled</p>
            <p className="text-sm text-amber-700 mt-1">
              No worries! You can try again when you&apos;re ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
