'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Loader2, Check, X, Clock, Download, User, RefreshCcw } from 'lucide-react'

interface Attendee {
  id: string
  email: string
  name: string | null
  timestamp: string
  paymentStatus: string | null
  paymentMethod: string | null
  paymentAmount: number | null
  paymentReference: string | null
  paidAt: string | null
  verifiedBy: string | null
  verifiedAt: string | null
}

interface EventDetails {
  id: string
  name: string
  isFree: boolean
  price: number | null
}

export default function AttendeesPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)

  // Fetch attendees
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Fetch event details
        const eventRes = await fetch(`/api/host/events/${eventId}`)
        if (!eventRes.ok) {
          if (eventRes.status === 401) {
            router.push('/organizer')
            return
          }
          throw new Error('Failed to load event')
        }
        const eventData = await eventRes.json()
        setEvent(eventData)

        // Fetch attendees
        const attendeesRes = await fetch(`/api/host/events/${eventId}/attendees`)
        if (!attendeesRes.ok) {
          throw new Error('Failed to load attendees')
        }
        const attendeesData = await attendeesRes.json()
        setAttendees(attendeesData.attendees || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, eventId])

  const handleVerify = async (attendeeId: string, action: 'confirm' | 'reject') => {
    setVerifyingId(attendeeId)
    try {
      const res = await fetch(`/api/host/payments/${attendeeId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to verify payment')
      }

      // Update local state
      setAttendees(prev => prev.map(a => {
        if (a.id === attendeeId) {
          return {
            ...a,
            paymentStatus: action === 'confirm' ? 'paid' : 'failed',
            verifiedAt: new Date().toISOString(),
            paidAt: action === 'confirm' ? new Date().toISOString() : null,
          }
        }
        return a
      }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify payment')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleRefund = async (attendeeId: string) => {
    if (!confirm('Are you sure you want to refund this payment? This action cannot be undone.')) {
      return
    }

    setRefundingId(attendeeId)
    try {
      const res = await fetch(`/api/host/events/${eventId}/attendees/${attendeeId}/refund`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process refund')
      }

      // Update local state
      setAttendees(prev => prev.map(a => {
        if (a.id === attendeeId) {
          return {
            ...a,
            paymentStatus: 'refunded',
          }
        }
        return a
      }))

      alert('Refund processed successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process refund')
    } finally {
      setRefundingId(null)
    }
  }

  const downloadCsv = () => {
    const headers = ['Name', 'Email', 'Registered', 'Payment Status', 'Payment Method', 'Reference']
    const rows = attendees.map(a => [
      a.name || '',
      a.email,
      new Date(a.timestamp).toLocaleDateString(),
      a.paymentStatus || 'free',
      a.paymentMethod || '-',
      a.paymentReference || '-',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event?.name || 'attendees'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const pendingPayments = attendees.filter(a => a.paymentStatus === 'pending')
  const confirmedAttendees = attendees.filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'free' || !a.paymentStatus)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-neutral-100">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-red-600">{error}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Attendees
            </h1>
            <p className="text-neutral-500">
              {event?.name} • {attendees.length} registered
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Pending Payments - Show first if any */}
        {pendingPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Verification ({pendingPayments.length})
            </h2>
            <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50">
              {pendingPayments.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-b border-amber-200 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {attendee.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-neutral-500">{attendee.email}</p>
                      <p className="text-xs text-amber-600 font-mono mt-0.5">
                        Ref: {attendee.paymentReference} • ${((attendee.paymentAmount || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerify(attendee.id, 'confirm')}
                      disabled={verifyingId === attendee.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {verifyingId === attendee.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => handleVerify(attendee.id, 'reject')}
                      disabled={verifyingId === attendee.id}
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Attendees */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Confirmed ({confirmedAttendees.length})
          </h2>
          {confirmedAttendees.length > 0 ? (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              {confirmedAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-neutral-600">
                        {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {attendee.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-neutral-500">{attendee.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {attendee.paymentStatus === 'paid' && attendee.paymentMethod === 'stripe' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          Paid ${((attendee.paymentAmount || 0) / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRefund(attendee.id)}
                          disabled={refundingId === attendee.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {refundingId === attendee.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3 h-3" />
                          )}
                          Refund
                        </button>
                      </div>
                    ) : attendee.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : attendee.paymentStatus === 'refunded' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full">
                        <RefreshCcw className="w-3 h-3" />
                        Refunded
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-400">
                        Free
                      </span>
                    )}
                    <p className="text-xs text-neutral-400">
                      {new Date(attendee.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-neutral-50 rounded-xl text-center">
              <p className="text-neutral-500">No attendees yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
