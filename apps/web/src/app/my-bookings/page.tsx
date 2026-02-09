'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  X,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
} from 'lucide-react'

interface Booking {
  id: string
  status: string
  paymentStatus: string
  amountPaid: number | null
  currency: string | null
  createdAt: string
  activity: {
    id: string
    slug: string | null
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

interface RefundPreview {
  status: 'full' | 'partial' | 'none'
  amount: number
  percentage: number
  currency: string
  hoursUntilEvent: number
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/my-bookings')
      return
    }

    if (isSignedIn) {
      fetchBookings()
    }
  }, [isLoaded, isSignedIn, router])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/users/me/bookings')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancelModalOpen(true)
    setCancelSuccess(false)
    setCancelError('')

    // Calculate refund preview
    if (booking.amountPaid && booking.amountPaid > 0 && booking.activity.startTime) {
      const startTime = new Date(booking.activity.startTime)
      const now = new Date()
      const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      let percentage = 0
      let status: 'full' | 'partial' | 'none' = 'none'

      if (hoursUntil > 24) {
        percentage = 100
        status = 'full'
      } else if (hoursUntil > 2) {
        percentage = 50
        status = 'partial'
      }

      setRefundPreview({
        status,
        amount: (booking.amountPaid * percentage) / 100,
        percentage,
        currency: booking.currency || 'SGD',
        hoursUntilEvent: Math.max(0, Math.floor(hoursUntil)),
      })
    } else {
      setRefundPreview(null)
    }
  }

  const handleCancel = async () => {
    if (!selectedBooking) return

    setCancelling(true)
    setCancelError('')

    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      setCancelSuccess(true)

      // Update bookings list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: 'CANCELLED' } : b
        )
      )

      // Close modal after delay
      setTimeout(() => {
        setCancelModalOpen(false)
        setSelectedBooking(null)
      }, 2000)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
            >
              Try again
            </button>
            <Link href="/support" className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm">
              Need help? Contact Support
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      b.status !== 'CANCELLED' &&
      b.activity.startTime &&
      new Date(b.activity.startTime) > new Date()
  )

  const pastBookings = bookings.filter(
    (b) =>
      b.status === 'CANCELLED' ||
      !b.activity.startTime ||
      new Date(b.activity.startTime) <= new Date()
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          My Bookings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          Manage your upcoming and past event bookings
        </p>

        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-2">
              No bookings yet
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              Find your next workout and book an experience!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              Browse Experiences
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Upcoming ({upcomingBookings.length})
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={() => openCancelModal(booking)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past/Cancelled Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
                  Past & Cancelled ({pastBookings.length})
                </h2>
                <div className="space-y-4 opacity-70">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} isPast />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Help Link */}
        <div className="mt-12 text-center">
          <Link
            href="/support"
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm"
          >
            Need help? Visit our support page
          </Link>
        </div>
      </main>

      {/* Cancel Modal */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            {cancelSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Booking Cancelled
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {refundPreview && refundPreview.amount > 0
                    ? `Your refund of ${refundPreview.currency} ${refundPreview.amount.toFixed(2)} will be processed within 5-10 business days.`
                    : 'Your booking has been cancelled.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Cancel Booking
                  </h3>
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Are you sure you want to cancel your booking for{' '}
                    <strong>{selectedBooking.activity.title}</strong>?
                  </p>

                  {/* Refund Policy - only show for paid bookings */}
                  {selectedBooking.amountPaid && selectedBooking.amountPaid > 0 && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Refund Policy
                      </h4>
                      <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                        <li>• More than 24 hours before: <span className="text-green-600 dark:text-green-400">Full refund</span></li>
                        <li>• 2-24 hours before: <span className="text-amber-600 dark:text-amber-400">50% refund</span></li>
                        <li>• Less than 2 hours: <span className="text-red-600 dark:text-red-400">No refund</span></li>
                      </ul>
                    </div>
                  )}

                  {/* Refund Preview */}
                  {refundPreview && (
                    <div
                      className={`rounded-xl p-4 ${
                        refundPreview.status === 'full'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : refundPreview.status === 'partial'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p
                            className={`font-medium ${
                              refundPreview.status === 'full'
                                ? 'text-green-900 dark:text-green-100'
                                : refundPreview.status === 'partial'
                                ? 'text-amber-900 dark:text-amber-100'
                                : 'text-red-900 dark:text-red-100'
                            }`}
                          >
                            {refundPreview.status === 'full'
                              ? 'Full Refund'
                              : refundPreview.status === 'partial'
                              ? '50% Refund'
                              : 'No Refund'}
                          </p>
                          <p
                            className={`text-sm ${
                              refundPreview.status === 'full'
                                ? 'text-green-700 dark:text-green-300'
                                : refundPreview.status === 'partial'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}
                          >
                            {refundPreview.hoursUntilEvent} hours until event
                          </p>
                        </div>
                        <p
                          className={`text-xl font-bold ${
                            refundPreview.status === 'full'
                              ? 'text-green-900 dark:text-green-100'
                              : refundPreview.status === 'partial'
                              ? 'text-amber-900 dark:text-amber-100'
                              : 'text-red-900 dark:text-red-100'
                          }`}
                        >
                          {refundPreview.currency} {refundPreview.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {cancelError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">{cancelError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    disabled={cancelling}
                    className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Booking'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-2xl mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            href="/profile"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
            My Bookings
          </h1>
        </div>
      </div>
    </header>
  )
}

function BookingCard({
  booking,
  onCancel,
  isPast,
}: {
  booking: Booking
  onCancel?: () => void
  isPast?: boolean
}) {
  const activity = booking.activity
  const isCancelled = booking.status === 'CANCELLED'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="relative w-24 sm:w-32 flex-shrink-0">
          {activity.imageUrl ? (
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center min-h-[120px]">
              <Calendar className="w-8 h-8 text-neutral-400" />
            </div>
          )}
          {isCancelled && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 py-1 bg-red-600 rounded">
                Cancelled
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-2">
              {activity.title}
            </h3>
            <span className="flex-shrink-0 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-full">
              {activity.type}
            </span>
          </div>

          <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            {activity.startTime && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>{formatDate(activity.startTime)}</span>
              </div>
            )}
            {activity.startTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>{formatTime(activity.startTime)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span className="line-clamp-1">{activity.city}</span>
            </div>
          </div>

          {/* Payment Info */}
          {booking.amountPaid && booking.amountPaid > 0 && (
            <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Paid: {booking.currency || 'SGD'} {booking.amountPaid.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isPast && !isCancelled && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 flex gap-2">
          <Link
            href={`/e/${activity.slug || activity.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Event
          </Link>
          <Link
            href={`/booking/ticket?id=${booking.id}`}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Ticket
          </Link>
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
