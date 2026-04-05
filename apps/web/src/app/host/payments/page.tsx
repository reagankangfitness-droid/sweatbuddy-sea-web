'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CreditCard } from 'lucide-react'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'
import { PaymentRow } from '@/components/host/PaymentRow'

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

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // First verify session
        // Fetch payments
        const paymentsRes = await fetch('/api/host/payments/pending')
        if (!paymentsRes.ok) {
          if (paymentsRes.status === 401) {
            router.push('/sign-in?intent=host')
            return
          }
          throw new Error('Failed to load payments')
        }

        const data = await paymentsRes.json()
        setPayments(data.payments || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [router])

  const pendingPayments = payments.filter(p => p.paymentStatus === 'pending')
  const verifiedPayments = payments.filter(p => p.paymentStatus === 'paid')
  const rejectedPayments = payments.filter(p => p.paymentStatus === 'failed')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="border-b border-neutral-800">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
            <BackButton fallbackHref="/host/dashboard" />
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-neutral-100 hidden sm:inline">sweatbuddies</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-neutral-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <BackButton fallbackHref="/host/dashboard" />
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-100 hidden sm:inline">sweatbuddies</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">
              Payment Verification
            </h1>
            <p className="text-neutral-500">Verify PayNow payments from attendees</p>
          </div>
        </div>

        {/* Pending Payments */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
            Pending Verification
            {pendingPayments.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-900 text-amber-400 text-sm rounded-full font-medium">
                {pendingPayments.length}
              </span>
            )}
          </h2>

          {pendingPayments.length === 0 ? (
            <div className="border border-neutral-800 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500">No pending payments to verify</p>
              <p className="text-sm text-neutral-400 mt-1">Payments from PayNow will appear here</p>
            </div>
          ) : (
            <div className="border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {pendingPayments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </section>

        {/* Recently Verified */}
        {verifiedPayments.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-neutral-100 mb-4">
              Recently Verified
            </h2>
            <div className="border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {verifiedPayments.slice(0, 10).map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          </section>
        )}

        {/* Rejected */}
        {rejectedPayments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-100 mb-4">
              Rejected
            </h2>
            <div className="border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {rejectedPayments.slice(0, 5).map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
