'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import type { Event } from '@/lib/events'

interface Props {
  events: Event[]
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

export function FeaturedEventsCarousel({ events, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft
      const cardWidth = scrollRef.current.offsetWidth * 0.85
      const index = Math.round(scrollLeft / cardWidth)
      setActiveIndex(index)
    }
  }

  // Take first 5 events for featured
  const featuredEvents = events.slice(0, 5)

  if (featuredEvents.length === 0) return null

  return (
    <div className="md:hidden">
      {/* Section Header - Premium typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <span className="text-label-sm text-neutral-500 block mb-1">FEATURED</span>
          <h2 className="text-display-card">Trending This Week</h2>
        </div>
        <button
          onClick={() => {
            const eventsSection = document.getElementById('events')
            if (eventsSection) {
              eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          className="text-ui text-neutral-600 hover:text-neutral-800"
        >
          See all →
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
        style={{ scrollPaddingLeft: '16px' }}
      >
        {featuredEvents.map((event, index) => (
          <div
            key={event.id}
            onClick={() => onSelect(event)}
            className="flex-shrink-0 w-[85vw] snap-start cursor-pointer"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white shadow-lg">
              {/* Image or Placeholder */}
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="85vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sand to-mist flex items-center justify-center">
                  <span className="text-8xl">{getCategoryEmoji(event.category)}</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Category Badge - Neutral */}
              <div className="absolute top-4 left-4">
                <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-neutral-700 rounded-full border border-neutral-100/50">
                  {event.category}
                </span>
              </div>

              {/* Weekly Badge - Neutral dark */}
              {event.recurring && (
                <div className="absolute top-4 right-4">
                  <span className="bg-neutral-900/90 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-medium rounded-full">
                    WEEKLY
                  </span>
                </div>
              )}

              {/* Content - Premium typography */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-sans text-2xl font-semibold mb-2 line-clamp-2" style={{ letterSpacing: '-0.01em' }}>
                  {event.name}
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  {event.day} • {event.time}
                </p>

                {/* CTA - Primary black */}
                <button className="w-full bg-neutral-900 py-3 text-base font-semibold rounded-full active:scale-95 transition-transform shadow-md" style={{ color: '#FFFFFF' }}>
                  I&apos;m Going
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {featuredEvents.map((_, index) => (
          <div
            key={index}
            className={`
              h-1.5 rounded-full transition-all duration-300 bg-neutral-900
              ${activeIndex === index
                ? 'w-6'
                : 'w-1.5 opacity-30'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
