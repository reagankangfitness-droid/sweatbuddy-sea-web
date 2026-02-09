'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Share2, Heart, ExternalLink, Instagram, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { AttendanceModal } from '@/components/AttendanceModal'
import { PaymentModal } from '@/components/event/PaymentModal'
import { ShareButton } from '@/components/ShareButton'
import { Confetti, useConfetti } from '@/components/ui/Confetti'
import { DirectChatWindow } from '@/components/DirectChatWindow'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface AttendeePreview {
  id: string
  name: string
}

interface Event {
  id: string
  slug: string | null
  name: string
  category: string
  day: string
  eventDate: string | null
  time: string
  location: string
  latitude: number | null
  longitude: number | null
  description: string | null
  organizer: string
  organizerName: string
  imageUrl: string | null
  communityLink: string | null
  recurring: boolean
  goingCount: number
  isFull: boolean
  isFree: boolean
  price: number | null
  paynowEnabled: boolean
  paynowQrCode: string | null
  paynowNumber: string | null
  attendeesPreview: AttendeePreview[]
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

export function EventPageClient({ event }: { event: Event }) {
  const [isGoing, setIsGoing] = useState(() => {
    if (typeof window === 'undefined') return false
    const going = safeGetJSON<string[]>('sweatbuddies_going', [])
    return going.includes(event.id)
  })
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
    return saved.includes(event.id)
  })
  const [goingCount, setGoingCount] = useState(event.goingCount)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(() => {
    if (typeof window === 'undefined') return null
    return safeGetJSON<{ email: string; name: string } | null>('sweatbuddies_user', null)
  })

  const confetti = useConfetti()
  const emoji = categoryEmojis[event.category] || '✨'
  const isPaid = !event.isFree && event.price && event.price > 0

  const handleSave = () => {
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
    if (isSaved) {
      safeSetJSON('sweatbuddies_saved', saved.filter(id => id !== event.id))
    } else {
      safeSetJSON('sweatbuddies_saved', [...saved, event.id])
    }
    setIsSaved(!isSaved)
  }

  const handleRSVP = () => {
    if (isGoing) {
      // Toggle off
      const going = safeGetJSON<string[]>('sweatbuddies_going', [])
      safeSetJSON('sweatbuddies_going', going.filter(id => id !== event.id))
      setIsGoing(false)
      setGoingCount(Math.max(0, goingCount - 1))
    } else if (isPaid) {
      setShowPaymentModal(true)
    } else {
      setShowAttendanceModal(true)
    }
  }

  const handleGoingSuccess = () => {
    setIsGoing(true)
    setGoingCount(goingCount + 1)
    confetti.trigger()
  }

  const formatDate = () => {
    if (event.recurring) return event.day
    if (!event.eventDate) return event.day
    const date = new Date(event.eventDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/#events" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to experiences</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton
              eventName={event.name}
              eventId={event.slug || event.id}
            />
            <button
              onClick={handleSave}
              className={`p-2 rounded-full transition-colors ${
                isSaved ? 'text-red-500' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-neutral-100">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">{emoji}</span>
          </div>
        )}
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <span>{emoji}</span>
                <span>{event.category}</span>
                {event.recurring && (
                  <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-xs font-medium">
                    Weekly
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                {event.name}
              </h1>
              <div className="flex items-center justify-between">
                <Link
                  href={`https://instagram.com/${event.organizer}`}
                  target="_blank"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {event.organizerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Hosted by {event.organizerName}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">@{event.organizer}</p>
                  </div>
                </Link>
                <button
                  onClick={() => setShowChat(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Message</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Event Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{formatDate()}</p>
                  <p className="text-neutral-500">{event.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{event.location}</p>
                  {event.latitude && event.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Get directions
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">About this experience</h2>
                <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Community Link - hidden for now */}

            {/* Attendees */}
            {goingCount > 0 && (
              <>
                <div className="border-t border-neutral-200" />
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Who&apos;s going ({goingCount})
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {event.attendeesPreview.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-full"
                      >
                        <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600">
                          {attendee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-neutral-700">{attendee.name}</span>
                      </div>
                    ))}
                    {goingCount > event.attendeesPreview.length && (
                      <div className="flex items-center px-3 py-2 text-sm text-neutral-500">
                        +{goingCount - event.attendeesPreview.length} more
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Sticky RSVP Widget */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-lg">
                {/* Price */}
                <div className="mb-6">
                  {isPaid ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-900">
                        ${(event.price! / 100).toFixed(0)}
                      </span>
                      <span className="text-neutral-500">per person</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-green-600">Free</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        No payment required
                      </span>
                    </div>
                  )}
                </div>

                {/* RSVP Button */}
                {event.isFull ? (
                  <button
                    disabled
                    className="w-full py-4 bg-neutral-200 text-neutral-500 rounded-xl font-semibold text-lg cursor-not-allowed"
                  >
                    Experience Full
                  </button>
                ) : isGoing ? (
                  <motion.button
                    onClick={handleRSVP}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-green-100 text-green-700 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    <span>✓</span> You&apos;re Going
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleRSVP}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-colors"
                  >
                    {isPaid ? `Reserve for $${(event.price! / 100).toFixed(0)}` : "I'm In"}
                  </motion.button>
                )}

                {/* Going count */}
                <p className="text-center text-neutral-500 mt-4 text-sm">
                  {goingCount === 0
                    ? 'Spots available'
                    : `${goingCount} ${goingCount === 1 ? 'person' : 'people'} going`}
                </p>

                {/* Date & Time Summary */}
                <div className="mt-6 pt-6 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600">{formatDate()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            {isPaid ? (
              <span className="text-xl font-bold text-neutral-900">
                ${(event.price! / 100).toFixed(0)}
              </span>
            ) : (
              <span className="text-xl font-bold text-green-600">Free</span>
            )}
            <p className="text-sm text-neutral-500">{goingCount} going</p>
          </div>
          {event.isFull ? (
            <button
              disabled
              className="flex-1 py-3 bg-neutral-200 text-neutral-500 rounded-xl font-semibold cursor-not-allowed"
            >
              Event Full
            </button>
          ) : isGoing ? (
            <button
              onClick={handleRSVP}
              className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-semibold"
            >
              ✓ You&apos;re Going
            </button>
          ) : (
            <button
              onClick={handleRSVP}
              className="flex-1 py-3 bg-neutral-900 text-white rounded-xl font-semibold"
            >
              {isPaid ? 'Reserve' : "I'm In"}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AttendanceModal
        event={event}
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        onSuccess={handleGoingSuccess}
      />

      {isPaid && event.price && showPaymentModal && (
        <PaymentModal
          event={{ ...event, price: event.price }}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handleGoingSuccess}
        />
      )}

      <Confetti isActive={confetti.isActive} onComplete={confetti.reset} />

      {/* Message Host Chat */}
      <DirectChatWindow
        eventId={event.id}
        eventName={event.name}
        organizerHandle={event.organizer}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        userEmail={userInfo?.email}
        userName={userInfo?.name}
      />
    </div>
  )
}
