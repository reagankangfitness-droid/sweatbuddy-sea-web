'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, Users, MapPin, RefreshCw } from 'lucide-react'
import type { NeighborhoodEvent } from '@/types/neighborhood'

interface EventCardCompactProps {
  event: NeighborhoodEvent
}

export function EventCardCompact({ event }: EventCardCompactProps) {
  const router = useRouter()

  const formatTime = (datetime: string) => {
    const date = new Date(datetime)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (isToday) return `Today ${timeStr}`
    if (isTomorrow) return `Tomorrow ${timeStr}`
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ` ${timeStr}`
  }

  const handleClick = () => {
    router.push(`/events/${event.slug}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex gap-3 p-3 bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-md hover:border-neutral-200 transition-all text-left"
    >
      {/* Event image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="text-2xl">
              {event.category === 'Running' && '🏃'}
              {event.category === 'Yoga' && '🧘'}
              {event.category === 'Cycling' && '🚴'}
              {event.category === 'Swimming' && '🏊'}
              {event.category === 'HIIT' && '💪'}
              {event.category === 'Breathwork' && '🌬️'}
              {!['Running', 'Yoga', 'Cycling', 'Swimming', 'HIIT', 'Breathwork'].includes(event.category) && '🏋️'}
            </span>
          </div>
        )}
        {event.isRecurring && (
          <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5">
            <RefreshCw className="w-3 h-3 text-neutral-600" />
          </div>
        )}
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-neutral-900 text-sm line-clamp-1 mb-0.5">
            {event.title}
          </h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(event.datetime)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Attendee avatars */}
            <div className="flex -space-x-1.5">
              {event.attendeeAvatars.slice(0, 3).map((avatar, index) => (
                <div
                  key={index}
                  className={`w-5 h-5 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-medium text-neutral-700 border border-white`}
                >
                  {avatar.initial}
                </div>
              ))}
            </div>
            <span className="text-xs text-neutral-500">
              {event.attendeeCount} going
              {event.capacity && ` / ${event.capacity}`}
            </span>
          </div>

          {/* Price badge */}
          {event.price !== null && event.price > 0 ? (
            <span className="text-xs font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full">
              ${event.price}
            </span>
          ) : (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Free
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
