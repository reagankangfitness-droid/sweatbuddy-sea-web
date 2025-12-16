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

const cardColors = [
  '#E07A5F', // terracotta
  '#4F46E5', // electric
  '#10B981', // mint
  '#0F172A', // navy
]

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
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="font-display text-xl font-bold text-navy">🔥 Trending</h2>
        <button
          onClick={() => {
            const eventsSection = document.getElementById('events')
            if (eventsSection) {
              eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          className="text-sm text-terracotta font-semibold"
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
            <div
              className="relative aspect-[4/5] overflow-hidden border-2 border-navy bg-white"
              style={{ boxShadow: `6px 6px 0px 0px ${cardColors[index % cardColors.length]}` }}
            >
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
                <div className="absolute inset-0 bg-gradient-to-br from-sand to-cream flex items-center justify-center">
                  <span className="text-8xl">{getCategoryEmoji(event.category)}</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className="bg-sand px-3 py-1.5 text-xs font-bold text-navy border-2 border-navy"
                  style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
                >
                  {event.category}
                </span>
              </div>

              {/* Weekly Badge */}
              {event.recurring && (
                <div className="absolute top-4 right-4">
                  <span
                    className="bg-electric text-white px-3 py-1.5 text-xs font-bold border-2 border-navy"
                    style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
                  >
                    WEEKLY
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-display text-2xl font-bold mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {event.day} • {event.time}
                </p>

                {/* CTA */}
                <button
                  className="w-full bg-terracotta text-sand py-3 font-bold text-base active:scale-95 transition-transform border-2 border-sand"
                  style={{ boxShadow: '3px 3px 0px 0px #FAF7F2' }}
                >
                  🙋 I&apos;m Going
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
              h-1.5 transition-all duration-300 bg-navy
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
