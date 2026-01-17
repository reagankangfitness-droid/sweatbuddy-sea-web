'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, MapPin, Users, ExternalLink, ChevronDown, Download, Ticket } from 'lucide-react'
import Link from 'next/link'
import { generateGoogleCalendarUrl, generateOutlookWebUrl, downloadIcsFile } from '@/lib/calendar'

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
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false)
  const calendarDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(event.target as Node)) {
        setCalendarDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const getCalendarEvent = () => {
    if (!booking?.activity?.startTime) return null

    const activity = booking.activity
    const startDate = new Date(activity.startTime!)
    const endDate = activity.endTime
      ? new Date(activity.endTime)
      : new Date(startDate.getTime() + 60 * 60 * 1000)

    return {
      title: activity.title,
      description: `Booked via SweatBuddies\nHost: ${activity.user?.name || 'Unknown'}`,
      location: activity.city,
      startTime: startDate,
      endTime: endDate,
    }
  }

  const handleAddToGoogleCalendar = () => {
    const event = getCalendarEvent()
    if (event) {
      window.open(generateGoogleCalendarUrl(event), '_blank')
    }
    setCalendarDropdownOpen(false)
  }

  const handleAddToOutlook = () => {
    const event = getCalendarEvent()
    if (event) {
      window.open(generateOutlookWebUrl(event), '_blank')
    }
    setCalendarDropdownOpen(false)
  }

  const handleDownloadIcs = () => {
    const event = getCalendarEvent()
    if (event) {
      downloadIcsFile(event, `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`)
    }
    setCalendarDropdownOpen(false)
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
            <Button onClick={() => router.push('/my-bookings')} className="w-full">
              View My Bookings
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Browse Activities
            </Button>
            <Link href="/support" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Need help? Contact Support
              </Button>
            </Link>
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
            {/* Calendar Dropdown */}
            <div className="relative" ref={calendarDropdownRef}>
              <Button
                className="w-full gap-2 justify-between"
                onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Add to Calendar
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${calendarDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {calendarDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-10">
                  <button
                    onClick={handleAddToGoogleCalendar}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#4285F4"/>
                      <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-medium">Google Calendar</span>
                  </button>
                  <button
                    onClick={handleAddToOutlook}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left border-t border-border"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22 6L12 13L2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#0078D4"/>
                      <path d="M22 6L12 13L2 6" stroke="#0078D4" strokeWidth="2"/>
                    </svg>
                    <span className="font-medium">Outlook / Office 365</span>
                  </button>
                  <button
                    onClick={handleDownloadIcs}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left border-t border-border"
                  >
                    <Download className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Download .ics file</span>
                      <p className="text-xs text-muted-foreground">Apple Calendar, other apps</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Download Ticket */}
            <Link
              href={`/booking/ticket?${sessionId ? `session_id=${sessionId}` : `id=${bookingId}`}`}
              className="block"
            >
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download Ticket (PDF)
              </Button>
            </Link>

            {/* View My Bookings */}
            <Link href="/my-bookings" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Ticket className="w-4 h-4" />
                View My Bookings
              </Button>
            </Link>

            {booking?.activity && (
              <Link href={`/activities/${booking.activity.id}`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Users className="w-4 h-4" />
                  View Activity & Group Chat
                </Button>
              </Link>
            )}

            <Link href="/" className="block">
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Back to Home
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
