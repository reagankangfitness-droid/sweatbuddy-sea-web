'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Instagram, MapPin, MessageCircle } from 'lucide-react'
import { GoingButton } from './GoingButton'
import { ShareButton } from './ShareButton'
import { EventAttendees } from './EventAttendees'
import { DirectChatWindow } from './DirectChatWindow'
import { OrganizerProfile } from './OrganizerProfile'
import { detectPlatform } from '@/lib/community'

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
}

// Format date for display (e.g., "Sat, Dec 14")
function formatEventDate(dateStr: string | null | undefined, dayName: string): string {
  if (!dateStr) {
    // For recurring events, show the next occurrence day
    const dayMap: Record<string, number> = {
      'Sundays': 0, 'Mondays': 1, 'Tuesdays': 2, 'Wednesdays': 3,
      'Thursdays': 4, 'Fridays': 5, 'Saturdays': 6
    }
    const dayNum = dayMap[dayName]
    if (dayNum !== undefined) {
      const today = new Date()
      const daysUntil = (dayNum - today.getDay() + 7) % 7 || 7 // Next occurrence
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysUntil)
      return nextDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
    return dayName // Fallback for "Monthly", "Various", etc.
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
  const [userCredentials, setUserCredentials] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is going to this event and get their credentials
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      const userIsGoing = going.includes(event.id)
      setIsGoing(userIsGoing)

      // Get user credentials from localStorage
      if (userIsGoing) {
        const savedUser = localStorage.getItem('sweatbuddies_user')
        if (savedUser) {
          try {
            const { email, name } = JSON.parse(savedUser)
            setUserCredentials({ email: email || '', name: name || '' })
          } catch {
            setUserCredentials(null)
          }
        }
      }
    }
  }, [isOpen, event.id, attendeesRefresh])

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
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl max-h-[90vh] flex flex-col touch-none"
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors z-10"
            >
              <X className="w-4 h-4 text-neutral-600" />
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
                    <span className="absolute top-3 right-3 px-3 py-1 bg-neutral-900 text-white rounded-md text-[11px] font-medium flex items-center gap-1">
                      Weekly
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="px-5 py-4">
                {/* No image - show category badge */}
                {!event.imageUrl && (
                  <span className="inline-flex px-3 py-1 bg-neutral-100 rounded-md text-[11px] font-medium text-neutral-700 mb-3">
                    {emoji} {event.category}
                  </span>
                )}

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
                  {event.name}
                </h2>

                {/* Time & Location Summary */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mb-6">
                  <span className="flex items-center gap-1">
                    <span>📅</span> {formatEventDate(event.eventDate, event.day)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🕐</span> {event.time}
                  </span>
                  {event.recurring && (
                    <span className="flex items-center gap-1 text-neutral-900 font-medium">
                      <span>🔄</span> Weekly
                    </span>
                  )}
                </div>

                {/* Sections */}
                <div className="space-y-6">
                  {/* Who's Going - Social proof section (hidden when empty) */}
                  <EventAttendees eventId={event.id} refreshTrigger={attendeesRefresh} />

                  {/* About */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <span className="text-base">📝</span> About
                    </h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      {event.description || 'Join us for an amazing fitness session! All levels welcome.'}
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <span className="text-base">📍</span> Location
                    </h3>
                    <p className="text-sm text-neutral-500">{event.location}</p>
                  </div>

                  {/* Organizer */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                      <span className="text-base">👤</span> Organizer
                    </h3>
                    <OrganizerProfile handle={event.organizer} />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Actions Row */}
            <div className="flex items-center justify-center gap-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
              {/* Chat button - only visible when user is going */}
              {isGoing && (
                <button
                  onClick={() => setShowChat(true)}
                  className="flex flex-col items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <span className="w-11 h-11 bg-neutral-900 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </span>
                  <span className="text-xs font-medium text-neutral-900">Chat</span>
                </button>
              )}

              <a
                href={`https://instagram.com/${event.organizer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <span className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-neutral-200">
                  <Instagram className="w-5 h-5" />
                </span>
                <span className="text-xs font-medium">Instagram</span>
              </a>

              <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                <ShareButton
                  eventId={event.id}
                  eventSlug={event.slug}
                  eventName={event.name}
                  iconOnly
                />
                <span className="text-xs font-medium">Share</span>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <span className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-neutral-200">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-xs font-medium">Directions</span>
              </a>

              {/* Community Link - visible after RSVP, hint before */}
              {event.communityLink && (
                isGoing ? (
                  <a
                    href={event.communityLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      detectPlatform(event.communityLink) === 'whatsapp'
                        ? 'bg-[#25D366]'
                        : detectPlatform(event.communityLink) === 'telegram'
                        ? 'bg-[#0088cc]'
                        : 'bg-blue-600'
                    }`}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-xs font-medium">
                      {detectPlatform(event.communityLink) === 'whatsapp'
                        ? 'WhatsApp'
                        : detectPlatform(event.communityLink) === 'telegram'
                        ? 'Telegram'
                        : 'Community'}
                    </span>
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                    <span className="w-11 h-11 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200">
                      <MessageCircle className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-medium text-center leading-tight">RSVP to<br/>join group</span>
                  </div>
                )
              )}
            </div>

            {/* Sticky Footer CTA */}
            <div className="flex-shrink-0 p-4 border-t border-neutral-100 bg-white">
              <GoingButton
                eventId={event.id}
                eventName={event.name}
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
