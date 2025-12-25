'use client'

import Image from 'next/image'
import type { Event } from '@/lib/events'

interface Props {
  event: Event
  onSelect: (event: Event) => void
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Wellness': '💆',
  'Strength': '💪',
  'Cycling': '🚴',
  'Swimming': '🏊',
  'Dance': '💃',
  'Meditation': '🧘',
  'Boxing': '🥊',
  'Martial Arts': '🥋',
  'Pilates': '🤸',
  'CrossFit': '🏋️',
  'Bootcamp': '⚡',
  'Social': '🤝',
}

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || '✨'
}

export function EventListCard({ event, onSelect }: Props) {
  return (
    <div
      onClick={() => onSelect(event)}
      className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-neutral-50 relative rounded-xl">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-sand to-mist">
            {getCategoryEmoji(event.category)}
          </div>
        )}

        {/* Weekly badge */}
        {event.recurring && (
          <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 text-white text-[9px] font-medium py-0.5 text-center">
            WEEKLY
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Category */}
        <span className="text-label-sm font-medium text-neutral-900 uppercase tracking-wide">
          {event.category}
        </span>

        {/* Title */}
        <h3 className="font-sans font-semibold text-display-card text-neutral-900 line-clamp-1 mt-0.5">
          {event.name}
        </h3>

        {/* Time */}
        <p className="text-body-small text-neutral-600 mt-1 font-medium">
          {event.day} • {event.time}
        </p>

        {/* Location */}
        <p className="text-meta-sm text-neutral-400 mt-1 line-clamp-1">
          📍 {event.location}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center">
        <span className="text-neutral-300 text-xl font-bold">›</span>
      </div>
    </div>
  )
}
