'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Instagram, MapPin, MessageCircle, Clock, Star, Share2, Calendar, ExternalLink } from 'lucide-react'
import { GoingButton } from './GoingButton'
import { ShareButton } from './ShareButton'
import { EventAttendees } from './EventAttendees'
import { DirectChatWindow } from './DirectChatWindow'
import { OrganizerProfile } from './OrganizerProfile'
import { EventReviews } from './EventReviews'
import { AddToCalendar } from './AddToCalendar'
import { detectPlatform } from '@/lib/community'
import { safeGetJSON } from '@/lib/safe-storage'

interface Event {
  id: string
  slug?: string | null  // URL-friendly slug
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  description?: string | null
  organizer: string
  imageUrl?: string | null
  communityLink?: string | null
  recurring: boolean
  goingCount?: number
  isFull?: boolean
  // Pricing
  isFree?: boolean
  price?: number | null  // in cents
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
}

// Format date for display (e.g., "Sat, Dec 14")
// For recurring events: Always show "Every [Day]" format since they happen weekly
// For one-time events: Show the actual event date
function formatEventDate(dateStr: string | null | undefined, dayName: string, isRecurring: boolean = false): string {
  // RECURRING EVENTS: Show "Every [Day]" format - the eventDate is just an anchor, not when it happens
  if (isRecurring) {
    const dayMap: Record<string, string> = {
      'Sundays': 'Every Sun', 'Mondays': 'Every Mon', 'Tuesdays': 'Every Tue',
      'Wednesdays': 'Every Wed', 'Thursdays': 'Every Thu', 'Fridays': 'Every Fri',
      'Saturdays': 'Every Sat'
    }
    return dayMap[dayName] || dayName // Fallback to day name for "Monthly", "Various", etc.
  }

  // ONE-TIME EVENTS: Show the actual event date
  if (!dateStr) {
    return dayName // Fallback for events without dates
  }

  try {
    const date = new Date(dateStr)
    // Check if date is valid
    if (isNaN(date.getTime())) return dayName

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dayName
  }
}

interface EventDetailSheetProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onGoingSuccess?: () => void
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

export function EventDetailSheet({ event, isOpen, onClose, onGoingSuccess }: EventDetailSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [attendeesRefresh, setAttendeesRefresh] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [isGoing, setIsGoing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [userCredentials, setUserCredentials] = useState<{ email: string; name: string } | null>(null)

  // Determine if user can access community features
  // Free events: just need to be going
  // Paid events: need to have paid status confirmed
  const isPaidEvent = event.price && event.price > 0
  const canAccessCommunity = isGoing && (!isPaidEvent || paymentStatus === 'paid' || paymentStatus === 'free')
  const isPendingPayment = isPaidEvent && paymentStatus === 'pending'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check attendance status from backend
  const checkAttendanceStatus = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/attendance/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, eventIds: [event.id] }),
      })
      if (res.ok) {
        const data = await res.json()
        const status = data.status?.[event.id]
        if (status?.isAttending) {
          setIsGoing(true)
          setPaymentStatus(status.paymentStatus)
        }
      }
    } catch (err) {
      console.error('Failed to check attendance status:', err)
    }
  }, [event.id])

  // Check if user is going to this event and get their credentials
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      // First check localStorage for quick UI response
      const going = safeGetJSON<string[]>('sweatbuddies_going', [])
      const userIsGoing = going.includes(event.id)
      setIsGoing(userIsGoing)

      // Get user credentials from localStorage
      const savedUser = localStorage.getItem('sweatbuddies_user')
      if (savedUser) {
        try {
          const { email, name } = JSON.parse(savedUser)
          setUserCredentials({ email: email || '', name: name || '' })

          // For paid events, verify actual payment status from backend
          if (userIsGoing && email) {
            checkAttendanceStatus(email)
          }
        } catch {
          setUserCredentials(null)
        }
      }
    }
  }, [isOpen, event.id, attendeesRefresh, checkAttendanceStatus])

  // Handler for when someone joins - refresh attendees list and get credentials
  const handleGoingSuccess = () => {
    setAttendeesRefresh(prev => prev + 1)
    setIsGoing(true)

    // Get credentials immediately after joining
    const savedUser = localStorage.getItem('sweatbuddies_user')
    if (savedUser) {
      try {
        const { email, name } = JSON.parse(savedUser)
        setUserCredentials({ email: email || '', name: name || '' })
      } catch {
        // Ignore
      }
    }

    onGoingSuccess?.()
  }

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
    setDragY(0)
  }

  const emoji = categoryEmojis[event.category] || '✨'

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9998]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDrag={(_, info) => setDragY(info.offset.y)}
            onDragEnd={handleDragEnd}
            style={{ y: dragY > 0 ? dragY : 0 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[90vh] flex flex-col touch-none"
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors z-10"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain touch-auto">
              {/* Header Image */}
              {event.imageUrl && (
                <div className="relative h-48 mx-4 rounded-xl overflow-hidden">
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Category on image */}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-md text-[11px] font-medium text-neutral-700">
                    {emoji} {event.category}
                  </span>

                  {/* Recurring badge */}
                  {event.recurring && (
                    <span
                      className="absolute top-3 right-3 px-3 py-1 bg-neutral-900 text-white rounded-md text-[11px] font-medium flex items-center gap-1"
                      title="This happens every week—same time, same place"
                    >
                      Weekly
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="px-5 py-4">
                {/* No image - show category badge */}
                {!event.imageUrl && (
                  <span className="inline-flex px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    {emoji} {event.category}
                  </span>
                )}

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white mb-1">
                  {event.name}
                </h2>

                {/* Time & Location Summary */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  <span className="flex items-center gap-1">
                    <span>📅</span> {formatEventDate(event.eventDate, event.day, event.recurring)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🕐</span> {event.time}
                  </span>
                  {event.recurring && (
                    <span className="flex items-center gap-1 text-neutral-900 dark:text-white font-medium">
                      <span>🔄</span> Weekly
                    </span>
                  )}
                </div>

                {/* Host Block - Prominent placement with Instagram link */}
                <a
                  href={`https://instagram.com/${event.organizer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-6 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {event.organizer?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Hosted by</p>
                    <p className="font-semibold text-neutral-900 dark:text-white truncate">@{event.organizer}</p>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                    <Instagram className="w-4 h-4" />
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>

                {/* Sections */}
                <div className="space-y-6">
                  {/* Who's Going - Social proof section (hidden when empty) */}
                  <EventAttendees eventId={event.id} refreshTrigger={attendeesRefresh} />

                  {/* What to Expect */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                      <span className="text-base">✨</span> What to Expect
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {event.description || 'Join us for an amazing fitness session! All levels welcome.'}
                    </p>
                  </div>

                  {/* Where to Meet */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                      <span className="text-base">📍</span> Where to Meet
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{event.location}</p>
                  </div>

                  {/* Reviews Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> Reviews
                    </h3>
                    <EventReviews eventId={event.id} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row - Clean 4-icon layout */}
            <div className="flex items-center justify-center gap-8 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
              {/* Share */}
              <div className="flex flex-col items-center gap-1.5">
                <ShareButton
                  eventId={event.id}
                  eventSlug={event.slug}
                  eventName={event.name}
                  iconOnly
                />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Share</span>
              </div>

              {/* Directions */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <span className="w-11 h-11 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-600">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-xs font-medium">Directions</span>
              </a>

              {/* Calendar */}
              <AddToCalendar event={event} variant="icon" />

              {/* Chat with host */}
              {canAccessCommunity && (
                <button
                  onClick={() => setShowChat(true)}
                  className="flex flex-col items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="w-11 h-11 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white dark:text-neutral-900" />
                  </span>
                  <span className="text-xs font-medium">Chat</span>
                </button>
              )}
            </div>

            {/* Sticky Footer CTA */}
            <div className="flex-shrink-0 p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <GoingButton
                eventId={event.id}
                eventName={event.name}
                eventSlug={event.slug}
                eventDay={event.day}
                eventTime={event.time}
                eventLocation={event.location}
                eventOrganizer={event.organizer}
                eventDate={event.eventDate}
                communityLink={event.communityLink}
                initialCount={event.goingCount || 0}
                fullWidth
                onSuccess={handleGoingSuccess}
                isFull={event.isFull}
                isFree={event.isFree}
                price={event.price}
                paynowEnabled={event.paynowEnabled}
                paynowQrCode={event.paynowQrCode}
                paynowNumber={event.paynowNumber}
              />

              {/* Safe area padding for iOS */}
              <div className="h-[env(safe-area-inset-bottom)]" />
            </div>
          </motion.div>

          {/* Direct Chat Modal - 1:1 with organizer */}
          <DirectChatWindow
            eventId={event.id}
            eventName={event.name}
            organizerHandle={event.organizer}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            userEmail={userCredentials?.email}
            userName={userCredentials?.name}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
