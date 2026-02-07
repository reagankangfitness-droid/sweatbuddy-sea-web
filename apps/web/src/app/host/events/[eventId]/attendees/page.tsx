'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'
import { Loader2, Check, X, Clock, Download, User, RefreshCcw, Mail, Users, QrCode } from 'lucide-react'
import { EmailAttendeesModal } from '@/components/host/EmailAttendeesModal'
import { AttendanceToggleCompact } from '@/components/host/AttendanceToggle'

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
  totalAttendance: number
  isFirstTimer: boolean
  actuallyAttended: boolean | null
  markedAttendedAt: string | null
  markedAttendedBy: string | null
}

interface AttendanceStats {
  totalRSVPs: number
  firstTimerCount: number
  returningCount: number
  markedAttended: number
  markedNoShow: number
  unmarked: number
  showUpRate: number | null
}

// Get loyalty badge based on attendance count
function getLoyaltyBadge(count: number): { label: string; color: string; emoji: string } | null {
  if (count >= 20) return { label: 'Superfan', color: 'bg-purple-100 text-purple-700', emoji: '💎' }
  if (count >= 10) return { label: 'Loyal', color: 'bg-amber-100 text-amber-700', emoji: '🔥' }
  if (count >= 5) return { label: 'Regular', color: 'bg-blue-100 text-blue-700', emoji: '⭐' }
  if (count === 1) return { label: 'First time!', color: 'bg-green-100 text-green-700', emoji: '👋' }
  return null // 2-4 times, no badge
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
  const [firstTimers, setFirstTimers] = useState<Attendee[]>([])
  const [returningAttendees, setReturningAttendees] = useState<Attendee[]>([])
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)

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
        setFirstTimers(attendeesData.firstTimers || [])
        setReturningAttendees(attendeesData.returning || [])
        setStats(attendeesData.stats || null)
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

  // Handle attendance toggle update
  const handleAttendanceUpdate = (attendeeId: string, attended: boolean | null) => {
    setAttendees(prev => prev.map(a => {
      if (a.id === attendeeId) {
        return { ...a, actuallyAttended: attended }
      }
      return a
    }))
    // Update stats locally
    setStats(prev => {
      if (!prev) return prev
      const oldValue = attendees.find(a => a.id === attendeeId)?.actuallyAttended
      let { markedAttended, markedNoShow, unmarked } = prev

      // Remove from old category
      if (oldValue === true) markedAttended--
      else if (oldValue === false) markedNoShow--
      else unmarked--

      // Add to new category
      if (attended === true) markedAttended++
      else if (attended === false) markedNoShow++
      else unmarked++

      const showUpRate = markedAttended + markedNoShow > 0
        ? Math.round((markedAttended / (markedAttended + markedNoShow)) * 100)
        : null

      return { ...prev, markedAttended, markedNoShow, unmarked, showUpRate }
    })
  }

  const pendingPayments = attendees.filter(a => a.paymentStatus === 'pending')
  const confirmedAttendees = attendees.filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'free' || !a.paymentStatus)

  // Send welcome message to first-timers via WhatsApp
  const handleSendWelcome = () => {
    const names = firstTimers.map(a => a.name || a.email.split('@')[0]).slice(0, 5).join(', ')
    const moreCount = firstTimers.length > 5 ? ` and ${firstTimers.length - 5} more` : ''
    const message = encodeURIComponent(
      `Hey! Welcome to the crew 🙌\n\nExcited to have ${names}${moreCount} joining us for ${event?.name || 'the event'}!\n\nHere's what to know:\n📍 Check the event page for location\n⏰ Arrive a few minutes early\n\nSee you there!`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

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
        <div className="flex items-center gap-2 mb-8">
          <BackButton fallbackHref="/host/dashboard" />
          <span className="text-sm text-neutral-500">Back</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Who&apos;s Coming
            </h1>
            <p className="text-neutral-500">
              {event?.name} • {attendees.length === 0 ? 'No one yet' : attendees.length === 1 ? '1 person' : `${attendees.length} people`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/host/events/${eventId}/checkin`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              title="Scan QR codes to check in attendees"
            >
              <QrCode className="w-4 h-4" />
              Scan Check-ins
            </Link>
            {attendees.length > 0 && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                title="Send email to all attendees"
              >
                <Mail className="w-4 h-4" />
                Email All
              </button>
            )}
            <button
              onClick={downloadCsv}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              title="Download attendee list as spreadsheet"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Attendance Stats */}
        {stats && attendees.length > 0 && (
          <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-neutral-600" />
              <h3 className="font-semibold text-neutral-900">Attendance Tracking</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalRSVPs}</p>
                <p className="text-xs text-neutral-500">RSVPs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.markedAttended}</p>
                <p className="text-xs text-neutral-500">Showed Up</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.markedNoShow}</p>
                <p className="text-xs text-neutral-500">No-Show</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.showUpRate !== null ? `${stats.showUpRate}%` : '-'}
                </p>
                <p className="text-xs text-neutral-500">Show-up Rate</p>
              </div>
            </div>
            {stats.unmarked > 0 && (
              <p className="text-xs text-neutral-400 mt-3 text-center">
                {stats.unmarked} attendee{stats.unmarked !== 1 ? 's' : ''} not yet marked
              </p>
            )}
          </div>
        )}

        {/* First-Timers Section */}
        {firstTimers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <span className="text-lg">🆕</span>
                First-Timers ({firstTimers.length})
              </h2>
              <button
                onClick={handleSendWelcome}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Welcome
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700 mb-4">
                These people are new to your events - a warm welcome goes a long way!
              </p>
              <div className="grid gap-2">
                {firstTimers.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <AttendanceToggleCompact
                        attendeeId={attendee.id}
                        eventId={eventId}
                        initialValue={attendee.actuallyAttended}
                        onUpdate={(value) => handleAttendanceUpdate(attendee.id, value)}
                      />
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 font-medium text-sm">
                          {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          {attendee.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-neutral-500">{attendee.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      👋 First time!
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {attendee.name || 'Anonymous'}
                        </p>
                        {(() => {
                          const badge = getLoyaltyBadge(attendee.totalAttendance)
                          if (!badge) return null
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                              {badge.emoji} {badge.label}
                            </span>
                          )
                        })()}
                      </div>
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

        {/* Returning Attendees */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {returningAttendees.length > 0 ? `Returning (${returningAttendees.length})` : `All Attendees (${confirmedAttendees.length})`}
          </h2>
          {/* Show returning attendees (non-first-timers, excluding pending) */}
          {(() => {
            const displayAttendees = firstTimers.length > 0
              ? confirmedAttendees.filter(a => !a.isFirstTimer)
              : confirmedAttendees
            return displayAttendees.length > 0 ? (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              {displayAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {/* Attendance Toggle */}
                    <AttendanceToggleCompact
                      attendeeId={attendee.id}
                      eventId={eventId}
                      initialValue={attendee.actuallyAttended}
                      onUpdate={(value) => handleAttendanceUpdate(attendee.id, value)}
                    />
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-neutral-600">
                        {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {attendee.name || 'Anonymous'}
                        </p>
                        {(() => {
                          const badge = getLoyaltyBadge(attendee.totalAttendance)
                          if (!badge) return null
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                              {badge.emoji} {badge.label}
                            </span>
                          )
                        })()}
                      </div>
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
              <span className="text-4xl mb-3 block">👋</span>
              <p className="font-medium text-neutral-900 mb-1">
                {firstTimers.length > 0 ? 'No returning attendees yet' : 'No RSVPs yet'}
              </p>
              <p className="text-sm text-neutral-500">
                {firstTimers.length > 0 ? 'Everyone here is new!' : 'Share your event to get the word out!'}
              </p>
            </div>
          )
          })()}
        </div>
      </main>

      {/* Email Modal */}
      {showEmailModal && event && (
        <EmailAttendeesModal
          eventId={eventId}
          eventName={event.name}
          attendees={attendees}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  )
}
