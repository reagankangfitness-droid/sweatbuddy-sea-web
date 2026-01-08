'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, Users, XCircle } from 'lucide-react'
import { ShareEventButtons } from './ShareEventButtons'

interface Event {
  id: string
  name: string
  day: string
  date: string | null
  time: string
  location: string
  imageUrl: string | null
  goingCount: number
  recurring: boolean
  organizer?: string | null
}

interface UpcomingEventRowProps {
  event: Event
  onCancelled?: () => void
}

function formatDate(dateString: string | null, recurring: boolean): string {
  if (!dateString) {
    return recurring ? 'Every week' : 'TBD'
  }
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export function UpcomingEventRow({ event, onCancelled }: UpcomingEventRowProps) {
  const router = useRouter()
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleDuplicate = async () => {
    if (isDuplicating) return

    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/host/events/${event.id}/duplicate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate event')
      }

      alert(`Event duplicated! "${data.event.name}" will be reviewed before going live.`)
      router.refresh()
    } catch (error) {
      console.error('Duplicate error:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate event')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleCancel = async () => {
    if (isCancelling) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/host/events/${event.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel event')
      }

      alert(`Event cancelled. ${data.attendeesNotified} attendee(s) have been notified.`)
      setShowCancelConfirm(false)
      onCancelled?.()
    } catch (error) {
      console.error('Cancel error:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel event')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Title and going count */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate">
              {event.name}
            </h3>
            {/* Desktop: text, Mobile: icon with count */}
            <span className="hidden sm:inline text-sm text-neutral-500 whitespace-nowrap flex-shrink-0">
              {event.goingCount === 0 ? 'No one yet' : event.goingCount === 1 ? '1 going' : `${event.goingCount} going`}
            </span>
            <span className="sm:hidden flex items-center gap-1 text-xs text-neutral-500 flex-shrink-0">
              <Users className="w-3 h-3" />
              {event.goingCount}
            </span>
          </div>

          {/* Date and time */}
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
            {formatDate(event.date, event.recurring)} · {event.time}
          </p>

          {/* Location - hidden on very small screens */}
          <p className="text-xs sm:text-sm text-neutral-400 truncate hidden xs:block">
            {event.location}
          </p>

          {/* Actions - responsive layout */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
            <Link
              href={`/host/events/${event.id}/attendees`}
              className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Attendees
            </Link>
            <Link
              href={`/host/events/${event.id}/edit`}
              className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Duplicating...</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Duplicate</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs sm:text-sm font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <div className="ml-auto">
              <ShareEventButtons
                event={{
                  id: event.id,
                  name: event.name,
                  day: event.day,
                  time: event.time,
                  location: event.location,
                  organizer: event.organizer,
                }}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Cancel Event?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              This will cancel <strong>{event.name}</strong> and notify all {event.goingCount > 0 ? `${event.goingCount} ` : ''}attendee{event.goingCount !== 1 ? 's' : ''} via email.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Weather conditions, venue unavailable..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
