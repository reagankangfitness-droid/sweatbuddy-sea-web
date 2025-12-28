'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Heart, MapPin, Clock, X, Check, Bookmark } from 'lucide-react'
import { SwipeableCard } from './ui/SwipeableCard'
import { Confetti, useConfetti } from './ui/Confetti'
import type { Event } from '@/lib/events'

interface SwipeableEventBrowserProps {
  events: Event[]
  onJoin?: (event: Event) => void
  onSkip?: (event: Event) => void
  onSave?: (event: Event) => void
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

export function SwipeableEventBrowser({
  events,
  onJoin,
  onSkip,
  onSave,
}: SwipeableEventBrowserProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<{ event: Event; action: 'join' | 'skip' | 'save' }[]>([])
  const confetti = useConfetti()

  const currentEvent = events[currentIndex]
  const nextEvent = events[currentIndex + 1]
  const hasMore = currentIndex < events.length

  const handleSwipeRight = useCallback(() => {
    if (!currentEvent) return
    setHistory((prev) => [...prev, { event: currentEvent, action: 'join' }])
    onJoin?.(currentEvent)
    confetti.trigger()
    setCurrentIndex((prev) => prev + 1)
  }, [currentEvent, onJoin, confetti])

  const handleSwipeLeft = useCallback(() => {
    if (!currentEvent) return
    setHistory((prev) => [...prev, { event: currentEvent, action: 'skip' }])
    onSkip?.(currentEvent)
    setCurrentIndex((prev) => prev + 1)
  }, [currentEvent, onSkip])

  const handleSwipeUp = useCallback(() => {
    if (!currentEvent) return
    setHistory((prev) => [...prev, { event: currentEvent, action: 'save' }])
    onSave?.(currentEvent)
    setCurrentIndex((prev) => prev + 1)
  }, [currentEvent, onSave])

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    setHistory((prev) => prev.slice(0, -1))
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [history])

  if (!hasMore) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">You've seen all events!</h2>
        <p className="text-neutral-500 mb-6">
          Check back later for more or browse the full list
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-6 py-3 bg-neutral-900 text-white rounded-full font-semibold"
          >
            Start Over
          </button>
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-6 py-3 border border-neutral-300 rounded-full font-semibold"
            >
              Undo Last
            </button>
          )}
        </div>
      </div>
    )
  }

  const emoji = categoryEmojis[currentEvent.category] || '✨'

  return (
    <div className="relative h-[75vh] max-h-[600px] w-full max-w-sm mx-auto">
      {/* Card Stack */}
      <div className="relative h-full">
        {/* Next card preview (behind) */}
        {nextEvent && (
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden bg-white shadow-lg"
            style={{
              transform: 'scale(0.95) translateY(10px)',
              opacity: 0.7,
            }}
          >
            <div className="relative h-2/3">
              {nextEvent.imageUrl ? (
                <Image
                  src={nextEvent.imageUrl}
                  alt={nextEvent.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                  <span className="text-8xl">{categoryEmojis[nextEvent.category] || '✨'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current swipeable card */}
        <SwipeableCard
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeUp={handleSwipeUp}
          className="absolute inset-0 rounded-3xl overflow-hidden bg-white shadow-xl"
        >
          {/* Event Image */}
          <div className="relative h-2/3">
            {currentEvent.imageUrl ? (
              <Image
                src={currentEvent.imageUrl}
                alt={currentEvent.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                <span className="text-8xl">{emoji}</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold">
                {emoji} {currentEvent.category}
              </span>
            </div>

            {/* Price badge */}
            {!currentEvent.isFree && currentEvent.price && currentEvent.price > 0 && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm font-bold">
                  ${(currentEvent.price / 100).toFixed(0)}
                </span>
              </div>
            )}

            {/* Event info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h2 className="text-2xl font-bold mb-2 line-clamp-2">{currentEvent.name}</h2>
              <div className="flex items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentEvent.day} · {currentEvent.time}
                </span>
              </div>
            </div>
          </div>

          {/* Event details */}
          <div className="p-5 h-1/3 flex flex-col">
            <div className="flex items-center gap-2 text-neutral-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm line-clamp-1">{currentEvent.location}</span>
            </div>

            {currentEvent.description && (
              <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
                {currentEvent.description}
              </p>
            )}

            <div className="mt-auto text-xs text-neutral-400">
              Hosted by @{currentEvent.organizer}
            </div>
          </div>
        </SwipeableCard>
      </div>

      {/* Action buttons */}
      <div className="absolute -bottom-20 left-0 right-0 flex items-center justify-center gap-6">
        <button
          onClick={handleSwipeLeft}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors btn-press"
        >
          <X className="w-7 h-7" />
        </button>

        <button
          onClick={handleSwipeUp}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors btn-press"
        >
          <Bookmark className="w-6 h-6" />
        </button>

        <button
          onClick={handleSwipeRight}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors btn-press"
        >
          <Check className="w-7 h-7" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-1">
        {events.slice(0, Math.min(10, events.length)).map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all ${
              idx < currentIndex
                ? 'w-6 bg-green-500'
                : idx === currentIndex
                ? 'w-8 bg-neutral-900'
                : 'w-4 bg-neutral-200'
            }`}
          />
        ))}
        {events.length > 10 && (
          <span className="text-xs text-neutral-400 ml-2">+{events.length - 10}</span>
        )}
      </div>

      {/* Undo button */}
      {history.length > 0 && (
        <button
          onClick={handleUndo}
          className="absolute -top-8 right-0 text-sm text-neutral-500 hover:text-neutral-700"
        >
          Undo
        </button>
      )}

      <Confetti isActive={confetti.isActive} onComplete={confetti.reset} />
    </div>
  )
}
