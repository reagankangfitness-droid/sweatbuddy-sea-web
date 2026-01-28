'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { GoingButton } from '@/components/GoingButton'
import { PaymentModal } from '@/components/event/PaymentModal'
import { PaymentStatus } from '@/components/event/PaymentStatus'
import { WaitlistButton } from '@/components/WaitlistButton'

interface UnifiedEventClientProps {
  event: {
    id: string
    slug?: string | null
    name: string
    day: string
    time: string
    location: string
    organizer: string
    isFull?: boolean
    eventDate?: string | null
    isFree?: boolean
    price?: number | null
    paynowEnabled?: boolean
    paynowQrCode?: string | null
    paynowNumber?: string | null
  }
  initialGoingCount: number
  variant?: 'default' | 'mobile'
}

export function UnifiedEventClient({ event, initialGoingCount, variant = 'default' }: UnifiedEventClientProps) {
  const [copied, setCopied] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const isPaidEvent = !event.isFree && event.price && event.price > 0 && event.paynowEnabled
  const priceFormatted = event.price ? (event.price / 100).toFixed(2) : '0'

  const handleShare = async () => {
    const urlPath = event.slug || event.id
    const url = `https://www.sweatbuddies.co/e/${urlPath}`
    const text = `Join me at ${event.name}!`

    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, text, url })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Mobile variant - single row with share + CTA
  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-3">
        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
        </button>

        {/* Main CTA */}
        <div className="flex-1">
          {event.isFull ? (
            <WaitlistButton eventId={event.id} eventName={event.name} fullWidth />
          ) : isPaidEvent ? (
            <>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25"
              >
                Join Now · ${priceFormatted}
              </button>
              {showPaymentModal && (
                <PaymentModal
                  event={{
                    id: event.id,
                    name: event.name,
                    price: event.price || 0,
                    day: event.day,
                    time: event.time,
                    location: event.location,
                    paynowEnabled: event.paynowEnabled,
                    paynowQrCode: event.paynowQrCode,
                    paynowNumber: event.paynowNumber,
                  }}
                  onClose={() => {
                    setShowPaymentModal(false)
                    window.location.reload()
                  }}
                  onSuccess={() => {}}
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
              initialCount={initialGoingCount}
              fullWidth
            />
          )}
        </div>
      </div>
    )
  }

  // Default variant - stacked buttons
  return (
    <div className="space-y-3">
      {/* Payment Status Banner */}
      <PaymentStatus />

      {/* Main CTA */}
      {event.isFull ? (
        <WaitlistButton eventId={event.id} eventName={event.name} fullWidth />
      ) : isPaidEvent ? (
        <>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25"
          >
            Join Now · ${priceFormatted}
          </button>
          {showPaymentModal && (
            <PaymentModal
              event={{
                id: event.id,
                name: event.name,
                price: event.price || 0,
                day: event.day,
                time: event.time,
                location: event.location,
                paynowEnabled: event.paynowEnabled,
                paynowQrCode: event.paynowQrCode,
                paynowNumber: event.paynowNumber,
              }}
              onClose={() => {
                setShowPaymentModal(false)
                window.location.reload()
              }}
              onSuccess={() => {}}
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
          initialCount={initialGoingCount}
          fullWidth
        />
      )}

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share Event</span>
          </>
        )}
      </button>
    </div>
  )
}
