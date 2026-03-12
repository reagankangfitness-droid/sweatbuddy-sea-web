'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentApprovalCard } from '@/components/PaymentApprovalCard'

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

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/p2p/payments/pending')
      if (res.status === 401) {
        router.push('/sign-in')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayments(data.payments ?? [])
    } catch {
      toast.error('Failed to load pending payments')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  async function handleVerify(userActivityId: string, approved: boolean, reason?: string) {
    try {
      const res = await fetch(`/api/p2p/payments/${userActivityId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to verify payment')
        return
      }
      toast.success(approved ? 'Payment confirmed! Attendee is now joined.' : 'Payment rejected.')
      setPayments((prev) => prev.filter((p) => p.id !== userActivityId))
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">Pending Payments</h1>
            <p className="text-xs text-neutral-500">Verify PayNow payments from attendees</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-neutral-400 font-medium">No pending payments</p>
            <p className="text-neutral-600 text-sm mt-1">All payments have been verified</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-400">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} waiting for verification
            </p>
            {payments.map((payment) => (
              <PaymentApprovalCard
                key={payment.id}
                payment={payment}
                onApprove={(id) => handleVerify(id, true)}
                onReject={(id, reason) => handleVerify(id, false, reason)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
