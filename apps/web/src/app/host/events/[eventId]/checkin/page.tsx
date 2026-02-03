'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, Check, Clock } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CheckInSuccess } from '@/components/host/CheckInSuccess'

// Dynamic import QRScanner to avoid SSR issues with html5-qrcode
const QRScanner = dynamic(
  () => import('@/components/host/QRScanner').then((mod) => mod.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="bg-neutral-100 rounded-2xl p-8 text-center animate-pulse">
        <div className="w-12 h-12 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-32 mx-auto" />
      </div>
    ),
  }
)

interface CheckInResult {
  success: boolean
  attendee?: {
    name: string | null
    email: string
    checkedInAt: string
  }
  stats?: {
    checkedIn: number
    total: number
  }
  error?: string
}

interface RecentCheckIn {
  name: string | null
  email: string
  time: string
}

export default function CheckInPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<{ title: string } | null>(null)
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 })
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([])
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch event details and stats
  useEffect(() => {
    async function fetchEventData() {
      try {
        const res = await fetch(`/api/host/events/${eventId}/attendees`)
        if (res.ok) {
          const data = await res.json()
          setEvent({ title: data.event?.title || 'Event' })

          // Calculate check-in stats
          const attendees = [...(data.firstTimers || []), ...(data.returning || [])]
          const checkedIn = attendees.filter((a: { checkedInAt?: string }) => a.checkedInAt).length
          setStats({ checkedIn, total: attendees.length })

          // Get recent check-ins
          const recent = attendees
            .filter((a: { checkedInAt?: string }) => a.checkedInAt)
            .sort((a: { checkedInAt: string }, b: { checkedInAt: string }) =>
              new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
            )
            .slice(0, 5)
            .map((a: { name: string | null; email: string; checkedInAt: string }) => ({
              name: a.name,
              email: a.email,
              time: new Date(a.checkedInAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }))
          setRecentCheckIns(recent)
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  const handleScan = useCallback(async (code: string) => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/checkin/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setLastResult({
          success: true,
          attendee: data.attendee,
          stats: data.stats,
        })
        setStats(data.stats)
        setRecentCheckIns((prev) => [
          {
            name: data.attendee.name,
            email: data.attendee.email,
            time: new Date(data.attendee.checkedInAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
          ...prev.slice(0, 4),
        ])
      } else if (data.error === 'Already checked in') {
        setLastResult({
          success: false,
          attendee: data.attendee,
          error: 'Already checked in',
        })
      } else {
        setLastResult({
          success: false,
          error: data.error || 'Invalid check-in code',
        })
      }

      setShowResult(true)
    } catch {
      setLastResult({
        success: false,
        error: 'Failed to check in. Please try again.',
      })
      setShowResult(true)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  const handleCloseResult = useCallback(() => {
    setShowResult(false)
    setLastResult(null)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href={`/host/events/${eventId}/attendees`}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Attendees</span>
          </Link>

          <h1 className="text-xl font-bold text-neutral-900">
            {event?.title || 'Event'} Check-in
          </h1>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {stats.checkedIn} / {stats.total} checked in
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              {stats.total > 0
                ? Math.round((stats.checkedIn / stats.total) * 100)
                : 0}
              %
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{
                width: `${stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <QRScanner
          onScan={handleScan}
          onError={(error) => {
            setLastResult({ success: false, error })
            setShowResult(true)
          }}
          disabled={isProcessing}
        />
      </div>

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pb-8">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Recent Check-ins
          </h2>
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {recentCheckIns.map((checkIn, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {checkIn.name || 'Guest'}
                    </p>
                    <p className="text-sm text-neutral-500">{checkIn.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{checkIn.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Result Modal */}
      <CheckInSuccess
        show={showResult}
        attendee={lastResult?.attendee || null}
        error={lastResult?.error === 'Already checked in' ? null : lastResult?.error}
        alreadyCheckedIn={lastResult?.error === 'Already checked in'}
        onClose={handleCloseResult}
      />
    </div>
  )
}
