'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, MapPin, User, Clock, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BookingData {
  id: string
  status: string
  paymentStatus: string
  amountPaid: number | null
  currency: string | null
  paidAt: string | null
  activity: {
    id: string
    title: string
    type: string
    city: string
    startTime: string | null
    endTime: string | null
    imageUrl: string | null
    price: number
    currency: string
    user: {
      id: string
      name: string | null
      email: string
      imageUrl: string | null
    }
  }
}

function TicketContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  const sessionId = searchParams.get('session_id')

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!sessionId && !bookingId) {
        setError('No booking information provided')
        setLoading(false)
        return
      }

      try {
        const endpoint = sessionId
          ? `/api/booking/verify?session_id=${sessionId}`
          : `/api/users/me/bookings?id=${bookingId}`

        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error('Failed to fetch booking details')
        }

        const data = await response.json()

        if (data.booking) {
          setBooking(data.booking)
        } else if (data.bookings && data.bookings.length > 0) {
          setBooking(data.bookings[0])
        } else if (data.id) {
          setBooking(data)
        } else {
          throw new Error('Booking not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticket')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [sessionId, bookingId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/my-bookings"
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
            >
              View My Bookings
            </Link>
            <Link href="/" className="text-neutral-600 hover:text-neutral-900 underline text-sm">
              Return to homepage
            </Link>
            <Link href="/support" className="text-neutral-500 hover:text-neutral-700 text-sm">
              Need help? Contact Support
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activity = booking.activity
  const qrData = JSON.stringify({
    bookingId: booking.id,
    activityId: activity.id,
    timestamp: Date.now(),
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .ticket-container {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-neutral-100 py-8 px-4">
        {/* Action Bar - Hidden on print */}
        <div className="no-print max-w-md mx-auto mb-4 flex items-center justify-between">
          <Link
            href="/my-bookings"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">My Bookings</span>
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Save as PDF
          </button>
        </div>

        {/* Ticket */}
        <div className="ticket-container max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold">SweatBuddies</div>
              <div className="text-xs px-3 py-1 bg-white/20 rounded-full uppercase tracking-wide">
                {booking.paymentStatus === 'PAID' || booking.amountPaid ? 'Confirmed' : 'Free Experience'}
              </div>
            </div>
            <h1 className="text-xl font-semibold">{activity.title}</h1>
            <p className="text-white/70 text-sm mt-1">{activity.type}</p>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-neutral-100">
            {activity.startTime && (
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{formatDate(activity.startTime)}</p>
                  <p className="text-neutral-500 text-sm">
                    {formatTime(activity.startTime)}
                    {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{activity.city}</p>
                <p className="text-neutral-500 text-sm">Location</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{activity.user?.name || 'Host'}</p>
                <p className="text-neutral-500 text-sm">Your Host</p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 bg-neutral-50 flex flex-col items-center">
            <p className="text-sm text-neutral-500 mb-4">Scan for check-in</p>
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeSVG
                value={qrData}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-4 font-mono">
              {booking.id.toUpperCase().slice(0, 8)}
            </p>
          </div>

          {/* Payment Info */}
          {booking.amountPaid && booking.amountPaid > 0 && (
            <div className="p-6 border-t border-neutral-100 bg-green-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-700">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    {booking.currency || 'SGD'} {booking.amountPaid.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-neutral-900 text-center">
            <p className="text-white/60 text-xs">
              Show this ticket at the experience for check-in
            </p>
            <p className="text-white/40 text-xs mt-1">
              sweatbuddies.co
            </p>
          </div>
        </div>

        {/* Instructions - Hidden on print */}
        <div className="no-print max-w-md mx-auto mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-amber-800 text-sm">
            <strong>Tip:</strong> Click &quot;Save as PDF&quot; to download this ticket. On the print dialog,
            select &quot;Save as PDF&quot; as the destination.
          </p>
        </div>
      </div>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500">Loading...</p>
      </div>
    </div>
  )
}

export default function TicketPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketContent />
    </Suspense>
  )
}
