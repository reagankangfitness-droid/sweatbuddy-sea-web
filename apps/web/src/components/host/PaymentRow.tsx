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
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-neutral-900 truncate">{payment.email}</p>
            {isPaid && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check className="w-3 h-3" />
                Verified
              </span>
            )}
            {isFailed && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <X className="w-3 h-3" />
                Rejected
              </span>
            )}
          </div>
          {payment.name && (
            <p className="text-sm text-neutral-600">{payment.name}</p>
          )}
          <p className="text-sm text-neutral-500 mt-1">
            {payment.eventName} <span className="text-neutral-300">·</span> ${formattedAmount} SGD
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            Ref: <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{payment.paymentReference}</span>
            <span className="text-neutral-300 mx-2">·</span>
            {formattedDate}
          </p>
        </div>

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
  )
}
