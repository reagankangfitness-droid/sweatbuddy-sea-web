'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

export function MobileFloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAtEvents, setIsAtEvents] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const eventsSection = document.getElementById('events')

      if (eventsSection) {
        const eventsTop = eventsSection.offsetTop
        const eventsBottom = eventsTop + eventsSection.offsetHeight
        const windowBottom = scrollY + window.innerHeight

        // Hide when user is viewing events section
        const isViewingEvents = scrollY >= eventsTop - 200 && windowBottom <= eventsBottom + 200
        setIsAtEvents(isViewingEvents)
      }

      // Show after scrolling 300px
      setIsVisible(scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Don't show on desktop, when not scrolled enough, or when already at events
  if (!isVisible || isAtEvents) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <button
        onClick={handleClick}
        className="w-full bg-terracotta text-white py-4 font-semibold border-2 border-navy flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
        style={{
          boxShadow: '4px 4px 0px 0px #0F172A',
        }}
      >
        Browse Events
        <ArrowRight className="w-5 h-5" />
      </button>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
