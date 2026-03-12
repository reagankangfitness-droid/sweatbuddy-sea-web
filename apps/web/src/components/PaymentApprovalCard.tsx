'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PendingPayment {
  id: string
  paymentProofUrl: string | null
  amountPaid: number | null
  paymentProofUploadedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
  activity: {
    id: string
    title: string
    price: number
    currency: string
    startTime: string | null
  }
}

interface PaymentApprovalCardProps {
  payment: PendingPayment
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
}

export function PaymentApprovalCard({ payment, onApprove, onReject }: PaymentApprovalCardProps) {
  const [showProof, setShowProof] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)

  const amountDisplay = payment.amountPaid
    ? `${payment.activity.currency} ${(payment.amountPaid / 100).toFixed(0)}`
    : `${payment.activity.currency} ${(payment.activity.price / 100).toFixed(0)}`

  async function handleApprove() {
    setLoading(true)
    try {
      await onApprove(payment.id)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setLoading(true)
    try {
      await onReject(payment.id, rejectReason || undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Attendee info */}
        <div className="flex items-center gap-3">
          {payment.user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payment.user.imageUrl}
              alt={payment.user.name ?? ''}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-300">
              {(payment.user.name ?? payment.user.email)[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {payment.user.name ?? payment.user.email}
            </p>
            <p className="text-xs text-neutral-500 truncate">{payment.user.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-white">{amountDisplay}</p>
            <p className="text-xs text-amber-400">Pending</p>
          </div>
        </div>

        {/* Session info */}
        <div className="rounded-xl bg-neutral-800 px-3 py-2">
          <p className="text-xs text-neutral-400">Session</p>
          <p className="text-sm text-white font-medium">{payment.activity.title}</p>
          {payment.activity.startTime && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {format(new Date(payment.activity.startTime), 'EEE, MMM d · h:mm a')}
            </p>
          )}
        </div>

        {/* Proof submitted time */}
        {payment.paymentProofUploadedAt && (
          <p className="text-xs text-neutral-500">
            Proof submitted {format(new Date(payment.paymentProofUploadedAt), 'MMM d, h:mm a')}
          </p>
        )}

        {/* Show/hide proof toggle */}
        {payment.paymentProofUrl && (
          <button
            onClick={() => setShowProof((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {showProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showProof ? 'Hide' : 'View'} payment proof
          </button>
        )}

        {showProof && payment.paymentProofUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payment.paymentProofUrl}
            alt="Payment proof"
            className="w-full rounded-xl max-h-72 object-contain bg-neutral-800"
          />
        )}

        {/* Actions */}
        {!showRejectForm ? (
          <div className="flex gap-2 pt-1">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
              onClick={handleApprove}
            >
              I received {amountDisplay} ✓
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              disabled={loading}
              onClick={() => setShowRejectForm(true)}
            >
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-800 text-red-400 hover:bg-red-900/20"
                disabled={loading}
                onClick={handleReject}
              >
                Confirm reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setShowRejectForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
