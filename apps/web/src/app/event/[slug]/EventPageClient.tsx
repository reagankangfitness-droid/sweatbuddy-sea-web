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
import { formatEventDate } from '@/lib/event-dates'
import { FamiliarFacesLine } from '@/components/FamiliarFacesLine'
import { FollowButton } from '@/components/community/FollowButton'

interface AttendeePreview {
  id: string
  name: string
}

interface EventRecap {
  recapText: string
  photoUrl: string | null
  publishedAt: string
  attendeeCount: number
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
  recap: EventRecap | null
}

import { getCategoryEmoji } from '@/lib/categories'

interface FamiliarFace {
  name: string | null
  firstName: string | null
  imageUrl: string | null
  sharedEventCount: number
}

interface CommunityFollow {
  communityId: string | null
  isFollowing: boolean
}

export function EventPageClient({ event, familiarFaces = [], communityFollow }: { event: Event; familiarFaces?: FamiliarFace[]; communityFollow?: CommunityFollow }) {
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
  const emoji = getCategoryEmoji(event.category)
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
    return formatEventDate(event.eventDate, event.day, event.recurring, {
      weekday: 'long',
      month: 'long',
    })
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/#events" className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100">
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
                isSaved ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-neutral-800">
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
                  <span className="px-2 py-0.5 bg-neutral-800 rounded-full text-xs font-medium">
                    Weekly
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-4">
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
                    <p className="font-medium text-neutral-100">Hosted by {event.organizerName}</p>
                    <p className="text-sm text-neutral-500">@{event.organizer}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {communityFollow?.communityId && (
                    <FollowButton
                      communityId={communityFollow.communityId}
                      instagramHandle={event.organizer}
                      isFollowing={communityFollow.isFollowing}
                      compact
                    />
                  )}
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Message</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-800" />

            {/* Event Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-100">{formatDate()}</p>
                  <p className="text-neutral-500">{event.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-100">{event.location}</p>
                  {event.latitude && event.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline"
                    >
                      Get directions
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-800" />

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-xl font-semibold text-neutral-100 mb-4">About this experience</h2>
                <p className="text-neutral-400 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Community Link - hidden for now */}

            {/* Event Recap */}
            {event.recap && (
              <>
                <div className="border-t border-neutral-800" />
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-neutral-100 mb-4">
                    Event Recap
                  </h2>
                  {event.recap.photoUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <Image
                        src={event.recap.photoUrl}
                        alt="Event recap"
                        width={640}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {event.recap.recapText}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.recap.attendeeCount} {event.recap.attendeeCount === 1 ? 'person' : 'people'} joined
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(event.recap.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Familiar Faces */}
            {familiarFaces.length > 0 && (
              <>
                <div className="border-t border-neutral-800" />
                <div className="py-2">
                  <FamiliarFacesLine familiarFaces={familiarFaces} />
                </div>
              </>
            )}

            {/* Attendees */}
            {goingCount > 0 && (
              <>
                <div className="border-t border-neutral-800" />
                <div>
                  <h2 className="text-xl font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Who&apos;s going ({goingCount})
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {event.attendeesPreview.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-900 rounded-full"
                      >
                        <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center text-sm font-medium text-neutral-400">
                          {attendee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-neutral-300">{attendee.name}</span>
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
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-lg">
                {/* Price */}
                <div className="mb-6">
                  {isPaid ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-100">
                        ${(event.price! / 100).toFixed(2)}
                      </span>
                      <span className="text-neutral-500">per person</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-green-400">Free</span>
                      <span className="px-2 py-0.5 bg-green-900 text-green-400 rounded-full text-sm font-medium">
                        No payment required
                      </span>
                    </div>
                  )}
                </div>

                {/* RSVP Button */}
                {event.isFull ? (
                  <button
                    disabled
                    className="w-full py-4 bg-neutral-700 text-neutral-500 rounded-xl font-semibold text-lg cursor-not-allowed"
                  >
                    Event Full
                  </button>
                ) : isGoing ? (
                  <motion.button
                    onClick={handleRSVP}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-green-900 text-green-400 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    <span>✓</span> You&apos;re Going
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleRSVP}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-white text-neutral-900 rounded-xl font-semibold text-lg hover:bg-neutral-200 transition-colors"
                  >
                    {isPaid ? `Reserve for $${(event.price! / 100).toFixed(2)}` : "I'm In"}
                  </motion.button>
                )}

                {/* Going count */}
                <p className="text-center text-neutral-500 mt-4 text-sm">
                  {goingCount === 0
                    ? 'Spots available'
                    : `${goingCount} ${goingCount === 1 ? 'person' : 'people'} going`}
                </p>

                {/* Date & Time Summary */}
                <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400">{formatDate()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400 line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            {isPaid ? (
              <span className="text-xl font-bold text-neutral-100">
                ${(event.price! / 100).toFixed(2)}
              </span>
            ) : (
              <span className="text-xl font-bold text-green-400">Free</span>
            )}
            <p className="text-sm text-neutral-500">{goingCount} going</p>
          </div>
          {event.isFull ? (
            <button
              disabled
              className="flex-1 py-3 bg-neutral-700 text-neutral-500 rounded-xl font-semibold cursor-not-allowed"
            >
              Event Full
            </button>
          ) : isGoing ? (
            <button
              onClick={handleRSVP}
              className="flex-1 py-3 bg-green-900 text-green-400 rounded-xl font-semibold"
            >
              ✓ You&apos;re Going
            </button>
          ) : (
            <button
              onClick={handleRSVP}
              className="flex-1 py-3 bg-white text-neutral-900 rounded-xl font-semibold"
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
