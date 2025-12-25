'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
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

function BookingSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')
  const isFree = searchParams.get('free') === 'true'

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confettiTriggered, setConfettiTriggered] = useState(false)

  useEffect(() => {
    // Trigger confetti animation
    if (!confettiTriggered && (sessionId || bookingId)) {
      setConfettiTriggered(true)
      triggerConfetti()
    }
  }, [sessionId, bookingId, confettiTriggered])

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!sessionId && !bookingId) {
        setError('No booking information provided')
        setLoading(false)
        return
      }

      try {
        // Fetch booking details from API
        const endpoint = sessionId
          ? `/api/booking/verify?session_id=${sessionId}`
          : `/api/users/me/bookings?id=${bookingId}`

        const response = await fetch(endpoint)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch booking details')
        }

        const data = await response.json()

        // Handle different response formats
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
        console.error('Error fetching booking:', err)
        setError(err instanceof Error ? err.message : 'Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [sessionId, bookingId])

  const triggerConfetti = () => {
    // Simple CSS confetti animation instead of library
    const confettiContainer = document.createElement('div')
    confettiContainer.className = 'confetti-container'
    confettiContainer.innerHTML = Array(50)
      .fill(0)
      .map(() => `<div class="confetti" style="--delay: ${Math.random() * 3}s; --x: ${Math.random() * 100}vw; --color: ${['#0025CC', '#335CFF', '#FFD230', '#10B981', '#4ECDC4'][Math.floor(Math.random() * 5)]}"></div>`)
      .join('')
    document.body.appendChild(confettiContainer)

    setTimeout(() => {
      confettiContainer.remove()
    }, 4000)
  }

  const generateGoogleCalendarUrl = () => {
    if (!booking?.activity?.startTime) return '#'

    const activity = booking.activity
    const startTimeStr = activity.startTime
    if (!startTimeStr) return '#'

    const startDate = new Date(startTimeStr)
    const endDate = activity.endTime
      ? new Date(activity.endTime)
      : new Date(startDate.getTime() + 60 * 60 * 1000)

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: activity.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Booked via SweatBuddies\nHost: ${activity.user?.name || 'Unknown'}`,
      location: activity.city,
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your booking...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/host/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Browse Activities
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <style jsx global>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--color);
          top: -10px;
          left: var(--x);
          animation: confetti-fall 3s ease-out var(--delay) forwards;
          transform: rotate(45deg);
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-lg w-full">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">You&apos;re in!</h1>
            <p className="text-muted-foreground">
              {isFree ? 'Your spot is confirmed!' : 'Payment successful - your spot is confirmed!'}
            </p>
          </div>

          {/* Activity Card */}
          {booking?.activity && (
            <div className="bg-background rounded-xl overflow-hidden mb-6">
              {booking.activity.imageUrl && (
                <div className="h-32 overflow-hidden">
                  <img
                    src={booking.activity.imageUrl}
                    alt={booking.activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-lg">
                    {booking.activity.title}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary-dark font-medium">
                    {booking.activity.type}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {booking.activity.startTime && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {new Date(booking.activity.startTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{booking.activity.city}</span>
                  </div>
                </div>

                {/* Payment Info */}
                {booking.amountPaid && booking.amountPaid > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-semibold text-success">
                        {booking.currency || 'SGD'} {booking.amountPaid.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Host Info */}
                {booking.activity.user && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                    {booking.activity.user.imageUrl ? (
                      <img
                        src={booking.activity.user.imageUrl}
                        alt={booking.activity.user.name || 'Host'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {booking.activity.user.name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Hosted by </span>
                      <span className="font-medium text-foreground">
                        {booking.activity.user.name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full gap-2">
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </Button>
            </a>

            {booking?.activity && (
              <Link href={`/activities/${booking.activity.id}`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Users className="w-4 h-4" />
                  View Activity & Group Chat
                </Button>
              </Link>
            )}

            <Link href="/host/dashboard" className="block">
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Tip Section */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl">
            <p className="text-sm font-medium text-foreground mb-1">Quick tip</p>
            <p className="text-sm text-muted-foreground">
              Say hi in the group chat! It&apos;s a great way to connect with others before the workout.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  )
}

export default function BookingSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <BookingSuccessContent />
      </Suspense>
    </>
  )
}
