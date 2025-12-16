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
      className="flex gap-4 p-4 bg-white border-2 border-navy active:translate-x-[2px] active:translate-y-[2px] transition-transform cursor-pointer"
      style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-sand relative border-2 border-navy">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-sand to-cream">
            {getCategoryEmoji(event.category)}
          </div>
        )}

        {/* Weekly badge */}
        {event.recurring && (
          <div className="absolute bottom-0 left-0 right-0 bg-electric text-white text-[9px] font-bold py-0.5 text-center">
            WEEKLY
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Category */}
        <span className="text-xs font-bold text-terracotta uppercase tracking-wide">
          {event.category}
        </span>

        {/* Title */}
        <h3 className="font-bold text-base text-navy line-clamp-1 mt-0.5">
          {event.name}
        </h3>

        {/* Time */}
        <p className="text-sm text-navy/60 mt-1 font-medium">
          {event.day} • {event.time}
        </p>

        {/* Location */}
        <p className="text-xs text-navy/40 mt-1 line-clamp-1">
          📍 {event.location}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center">
        <span className="text-navy/30 text-xl font-bold">›</span>
      </div>
    </div>
  )
}
