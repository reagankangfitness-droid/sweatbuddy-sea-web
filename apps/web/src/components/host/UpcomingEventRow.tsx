'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
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

export function UpcomingEventRow({ event }: UpcomingEventRowProps) {
  const router = useRouter()
  const [isDuplicating, setIsDuplicating] = useState(false)

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

      // Show success and refresh the page to show the duplicated event
      alert(`Event duplicated! "${data.event.name}" will be reviewed before going live.`)
      router.refresh()
    } catch (error) {
      console.error('Duplicate error:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate event')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
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
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">
              {event.name}
            </h3>
            <span className="text-sm text-neutral-500 whitespace-nowrap flex-shrink-0">
              {event.goingCount} going
            </span>
          </div>

          <p className="text-sm text-neutral-500 mt-1">
            {formatDate(event.date, event.recurring)} · {event.time}
          </p>

          <p className="text-sm text-neutral-400 truncate">
            {event.location}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <Link
              href={`/host/events/${event.id}/attendees`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              View Attendees
            </Link>
            <Link
              href={`/host/events/${event.id}/edit`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Duplicating...</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </>
              )}
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
    </div>
  )
}
