'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'

interface Payment {
  id: string
  eventId: string
  eventName: string
  email: string
  name?: string | null
  amount: number
  paymentReference: string
  paymentStatus: string
  createdAt: string
}

interface PaymentRowProps {
  payment: Payment
}

export function PaymentRow({ payment }: PaymentRowProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null)

  const handleVerify = async (action: 'confirm' | 'reject') => {
    setIsProcessing(true)
    setActionType(action)

    try {
      const res = await fetch(`/api/host/payments/${payment.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Error handled silently
    } finally {
      setIsProcessing(false)
      setActionType(null)
    }
  }

  const formattedAmount = (payment.amount / 100).toFixed(2)
  const formattedDate = new Date(payment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const isPending = payment.paymentStatus === 'pending'
  const isPaid = payment.paymentStatus === 'paid'
  const isFailed = payment.paymentStatus === 'failed'

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: attendee info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-neutral-900 truncate">{payment.name || payment.email}</p>
            {isPaid && (
              <span className="flex items-center gap-1 text-sm text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {isFailed && (
              <span className="flex items-center gap-1 text-sm text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                <X className="w-3.5 h-3.5" />
                Rejected
              </span>
            )}
          </div>
          {payment.name && (
            <p className="text-sm text-neutral-500 mb-2">{payment.email}</p>
          )}
          <p className="text-sm text-neutral-500">{payment.eventName}</p>

          {/* Reference — prominent */}
          <div className="mt-3 inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Ref</span>
            <span className="font-mono text-sm font-semibold text-neutral-900">{payment.paymentReference}</span>
          </div>

          <p className="text-xs text-neutral-400 mt-2">{formattedDate}</p>
        </div>

        {/* Right: amount + actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <p className="text-lg font-bold text-neutral-900">${formattedAmount}</p>

          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => handleVerify('reject')}
                disabled={isProcessing}
                className="px-4 py-2 border border-neutral-200 rounded-full text-sm font-medium text-neutral-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isProcessing && actionType === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reject'
                )}
              </button>
              <button
                onClick={() => handleVerify('confirm')}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessing && actionType === 'confirm' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
