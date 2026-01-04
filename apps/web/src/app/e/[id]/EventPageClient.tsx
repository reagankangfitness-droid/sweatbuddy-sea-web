'use client'

import { useState } from 'react'
import { MapPin, Share2, Check, Instagram, MessageCircle, ExternalLink } from 'lucide-react'
import { GoingButton } from '@/components/GoingButton'
import { PaymentModal } from '@/components/event/PaymentModal'
import { PaymentStatus } from '@/components/event/PaymentStatus'
import { WaitlistButton } from '@/components/WaitlistButton'
import { detectPlatform, getJoinButtonText } from '@/lib/community'

interface EventPageClientProps {
  event: {
    id: string
    slug?: string | null  // URL-friendly slug
    name: string
    day: string
    time: string
    location: string
    organizer: string
    isFull?: boolean
    communityLink?: string | null
    eventDate?: string | null
    // Pricing fields
    isFree?: boolean
    price?: number | null
    paynowEnabled?: boolean
    paynowQrCode?: string | null
    paynowNumber?: string | null
  }
  initialGoingCount: number
}

export function EventPageClient({ event, initialGoingCount }: EventPageClientProps) {
  const [copied, setCopied] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Paid event = has price AND PayNow is enabled
  const isPaidEvent = !event.isFree && event.price && event.price > 0 && event.paynowEnabled

  // Price in dollars (no platform fee for PayNow)
  const priceFormatted = event.price ? (event.price / 100).toFixed(2) : '0'

  const handleShare = async () => {
    // Use slug for cleaner URLs if available, otherwise fall back to ID
    const urlPath = event.slug || event.id
    const url = `https://www.sweatbuddies.co/e/${urlPath}`
    const text = `Join me at ${event.name}! 🏃‍♂️`

    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, text, url })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-3">
      {/* Payment Status Banner */}
      <PaymentStatus />

      {/* Join/Pay Button or Waitlist */}
      {event.isFull ? (
        <WaitlistButton
          eventId={event.id}
          eventName={event.name}
          fullWidth
        />
      ) : isPaidEvent ? (
        <>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700"
          >
            <span>Join & Pay</span>
            <span className="text-purple-200">•</span>
            <span>${priceFormatted}</span>
          </button>

          {showPaymentModal && (
            <PaymentModal
              event={{
                id: event.id,
                name: event.name,
                price: event.price || 0,
                paynowEnabled: event.paynowEnabled,
                paynowQrCode: event.paynowQrCode,
                paynowNumber: event.paynowNumber,
              }}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={() => {
                setShowPaymentModal(false)
                window.location.reload()
              }}
            />
          )}
        </>
      ) : (
        <GoingButton
          eventId={event.id}
          eventName={event.name}
          eventDay={event.day}
          eventTime={event.time}
          eventLocation={event.location}
          eventOrganizer={event.organizer}
          eventDate={event.eventDate}
          communityLink={event.communityLink}
          initialCount={initialGoingCount}
          fullWidth
        />
      )}

      {/* Community Link - prominent if available */}
      {event.communityLink && (
        <a
          href={event.communityLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${
            detectPlatform(event.communityLink) === 'whatsapp'
              ? 'bg-[#25D366] hover:bg-[#20BD5A] text-white'
              : detectPlatform(event.communityLink) === 'telegram'
              ? 'bg-[#0088cc] hover:bg-[#0077b5] text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{getJoinButtonText(detectPlatform(event.communityLink))}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* Share */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </>
          )}
        </button>

        {/* Directions */}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span>Directions</span>
        </a>
      </div>

      {/* Instagram link */}
      <a
        href={`https://instagram.com/${event.organizer}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
      >
        <Instagram className="w-4 h-4" />
        <span>View @{event.organizer}</span>
      </a>
    </div>
  )
}
