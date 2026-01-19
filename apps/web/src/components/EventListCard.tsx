'use client'

import Image from 'next/image'
import type { Event } from '@/lib/events'
import { AvatarStack } from './ui/AvatarStack'

interface AttendeePreview {
  id: string
  name: string
  imageUrl?: string | null
}

interface ExtendedEvent extends Event {
  goingCount?: number
  attendeesPreview?: AttendeePreview[]
}

interface Props {
  event: ExtendedEvent
  onSelect: (event: ExtendedEvent) => void
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
      className="group flex gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card card-hover-lift active:scale-[0.98] cursor-pointer"
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative rounded-xl image-zoom-container">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-contain image-zoom"
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
        {/* Category + Price */}
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-medium text-neutral-900 dark:text-white uppercase tracking-wide">
            {event.category}
          </span>
          {event.price && event.price > 0 ? (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
              ${(event.price / 100).toFixed(0)}
            </span>
          ) : (event.isFree !== false) && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
              Free
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-sans font-semibold text-display-card text-neutral-900 dark:text-white line-clamp-1 mt-0.5">
          {event.name}
        </h3>

        {/* Time */}
        <p className="text-body-small text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
          {event.day} • {event.time}
        </p>

        {/* Attendees Preview */}
        {(() => {
          const count = event.goingCount || event.attendeesPreview?.length || 0
          return count > 0 || (event.attendeesPreview && event.attendeesPreview.length > 0) ? (
            <div className="flex items-center gap-2 mt-2">
              {event.attendeesPreview && event.attendeesPreview.length > 0 && (
                <AvatarStack
                  attendees={event.attendeesPreview}
                  maxDisplay={3}
                  size="sm"
                  showCount={false}
                />
              )}
              <span className="text-xs text-neutral-500">
                {count === 0
                  ? 'Open spots'
                  : count === 1
                  ? '1 person going'
                  : `${count} people going`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-neutral-500">Open spots</span>
            </div>
          )
        })()}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center">
        <span className="text-neutral-300 dark:text-neutral-600 text-xl font-bold">›</span>
      </div>
    </div>
  )
}
