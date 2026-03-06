'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'
import { Loader2, Check, X, Clock, Download, User, RefreshCcw, Mail, Users, QrCode, Sparkles } from 'lucide-react'
import { EmailAttendeesModal } from '@/components/host/EmailAttendeesModal'
import { AttendanceToggleCompact } from '@/components/host/AttendanceToggle'
import { SocialPostGenerator } from '@/components/host/SocialPostGenerator'

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
  if (count >= 20) return { label: 'Superfan', color: 'bg-purple-900 text-purple-700', emoji: '💎' }
  if (count >= 10) return { label: 'Loyal', color: 'bg-amber-900 text-amber-400', emoji: '🔥' }
  if (count >= 5) return { label: 'Regular', color: 'bg-blue-900 text-blue-700', emoji: '⭐' }
  if (count === 1) return { label: 'First time!', color: 'bg-green-900 text-green-400', emoji: '👋' }
  return null // 2-4 times, no badge
}

interface EventDetails {
  id: string
  name: string
  isFree: boolean
  price: number | null
  category: string
  location: string
  date: string | null
  time: string | null
  description: string | null
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
  const [showSocialGenerator, setShowSocialGenerator] = useState(false)
  const [visibleFirstTimers, setVisibleFirstTimers] = useState(15)
  const [visibleAttendees, setVisibleAttendees] = useState(15)

  // Fetch attendees
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/sign-in?intent=host')
          return
        }

        // Fetch event details
        const eventRes = await fetch(`/api/host/events/${eventId}`)
        if (!eventRes.ok) {
          if (eventRes.status === 401) {
            router.push('/sign-in?intent=host')
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
      toast.error(err instanceof Error ? err.message : 'Failed to verify payment')
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

      toast.success('Refund processed successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process refund')
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
      `Hey! Welcome to the crew 🙌\n\nExcited to have ${names}${moreCount} joining us for ${event?.name || 'the experience'}!\n\nHere's what to know:\n📍 Check the experience page for location\n⏰ Arrive a few minutes early\n\nSee you there!`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

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
          <div className="max-w-2xl mx-auto px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-neutral-100">sweatbuddies</span>
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-red-400">{error}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-100">sweatbuddies</span>
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
            <h1 className="text-2xl font-bold text-neutral-100">
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
              onClick={() => setShowSocialGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-orange-600 transition-colors"
              title="Generate social media content with AI"
            >
              <Sparkles className="w-4 h-4" />
              Social Post
            </button>
            <button
              onClick={downloadCsv}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-800 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
              title="Download attendee list as spreadsheet"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Attendance Stats */}
        {stats && attendees.length > 0 && (
          <div className="mb-8 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-neutral-400" />
              <h3 className="font-semibold text-neutral-100">Attendance Tracking</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-100">{stats.totalRSVPs}</p>
                <p className="text-xs text-neutral-500">RSVPs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.markedAttended}</p>
                <p className="text-xs text-neutral-500">Showed Up</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.markedNoShow}</p>
                <p className="text-xs text-neutral-500">No-Show</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">
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
              <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
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
            <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-400 mb-4">
                These people are new to your experiences - a warm welcome goes a long way!
              </p>
              <div className="grid gap-2">
                {firstTimers.slice(0, visibleFirstTimers).map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between bg-neutral-950 rounded-lg p-3 border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <AttendanceToggleCompact
                        attendeeId={attendee.id}
                        eventId={eventId}
                        initialValue={attendee.actuallyAttended}
                        onUpdate={(value) => handleAttendanceUpdate(attendee.id, value)}
                      />
                      <div className="w-8 h-8 bg-amber-900 rounded-full flex items-center justify-center">
                        <span className="text-amber-400 font-medium text-sm">
                          {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-100 text-sm">
                          {attendee.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-neutral-500">{attendee.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-900 text-green-400">
                      👋 First time!
                    </span>
                  </div>
                ))}
              </div>
              {firstTimers.length > visibleFirstTimers && (
                <button
                  onClick={() => setVisibleFirstTimers(prev => prev + 15)}
                  className="mt-3 w-full py-2.5 text-sm font-medium text-amber-400 bg-neutral-950 border border-amber-800 rounded-lg hover:bg-amber-950 transition-colors"
                >
                  Load more ({firstTimers.length - visibleFirstTimers} remaining)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pending Payments - Show first if any */}
        {pendingPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Verification ({pendingPayments.length})
            </h2>
            <div className="border border-amber-800 rounded-xl overflow-hidden bg-amber-950">
              {pendingPayments.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-b border-amber-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-100">
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
                      <p className="text-xs text-amber-400 font-mono mt-0.5">
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
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-800 text-neutral-400 text-sm font-medium rounded-full hover:bg-neutral-900 transition-colors disabled:opacity-50"
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
          <h2 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {returningAttendees.length > 0 ? `Returning (${returningAttendees.length})` : `All Attendees (${confirmedAttendees.length})`}
          </h2>
          {/* Show returning attendees (non-first-timers, excluding pending) */}
          {(() => {
            const displayAttendees = firstTimers.length > 0
              ? confirmedAttendees.filter(a => !a.isFirstTimer)
              : confirmedAttendees
            return displayAttendees.length > 0 ? (
            <>
            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              {displayAttendees.slice(0, visibleAttendees).map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-b border-neutral-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {/* Attendance Toggle */}
                    <AttendanceToggleCompact
                      attendeeId={attendee.id}
                      eventId={eventId}
                      initialValue={attendee.actuallyAttended}
                      onUpdate={(value) => handleAttendanceUpdate(attendee.id, value)}
                    />
                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
                      <span className="font-medium text-neutral-400">
                        {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-100">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-900 text-green-400 text-xs font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          Paid ${((attendee.paymentAmount || 0) / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRefund(attendee.id)}
                          disabled={refundingId === attendee.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 hover:text-red-700 hover:bg-red-950 rounded transition-colors disabled:opacity-50"
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-900 text-green-400 text-xs font-medium rounded-full">
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : attendee.paymentStatus === 'refunded' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-500 text-xs font-medium rounded-full">
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
            {displayAttendees.length > visibleAttendees && (
              <button
                onClick={() => setVisibleAttendees(prev => prev + 15)}
                className="mt-4 w-full py-2.5 text-sm font-medium text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-neutral-900 transition-colors"
              >
                Load more ({displayAttendees.length - visibleAttendees} remaining)
              </button>
            )}
            </>
          ) : (
            <div className="p-8 bg-neutral-900 rounded-xl text-center">
              <span className="text-4xl mb-3 block">👋</span>
              <p className="font-medium text-neutral-100 mb-1">
                {firstTimers.length > 0 ? 'No returning attendees yet' : 'No RSVPs yet'}
              </p>
              <p className="text-sm text-neutral-500">
                {firstTimers.length > 0 ? 'Everyone here is new!' : 'Share your experience to get the word out!'}
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

      {/* Social Post Generator Modal */}
      {showSocialGenerator && event && (
        <SocialPostGenerator
          eventId={eventId}
          eventName={event.name}
          category={event.category}
          location={event.location}
          date={event.date}
          time={event.time}
          description={event.description}
          onClose={() => setShowSocialGenerator(false)}
        />
      )}
    </div>
  )
}
