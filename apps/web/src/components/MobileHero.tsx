'use client'

import { ArrowRight, Calendar } from 'lucide-react'

export function MobileHero() {
  const handleClick = (href: string) => {
    const scrollToElement = (attempts = 0) => {
      const element = document.getElementById(href)
      if (element) {
        // Use window.scrollTo for better mobile compatibility
        const top = element.getBoundingClientRect().top + window.scrollY - 20
        window.scrollTo({ top, behavior: 'smooth' })
      } else if (attempts < 10) {
        // Retry after 100ms if element not found (dynamic import loading)
        setTimeout(() => scrollToElement(attempts + 1), 100)
      }
    }
    scrollToElement()
  }

  return (
    <div className="md:hidden pt-20 px-4 pb-8 bg-sand">
      {/* Compact headline */}
      <h1 className="font-display text-4xl font-bold leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
        Find Your Crew.
        <br />
        <span className="text-terracotta">Sweat Together.</span>
      </h1>

      <p className="text-navy/70 mb-6">
        Open fitness events across Southeast Asia. No memberships. Just show up.
      </p>

      {/* Stats Row - Neo-Brutalist */}
      <div className="flex gap-3 mb-6">
        <div
          className="flex-1 bg-white p-3 text-center border-2 border-navy"
          style={{ boxShadow: '3px 3px 0px 0px #E07A5F' }}
        >
          <span className="font-display text-2xl font-bold text-navy block">50+</span>
          <span className="text-xs text-navy/60 font-medium">events</span>
        </div>
        <div
          className="flex-1 bg-white p-3 text-center border-2 border-navy"
          style={{ boxShadow: '3px 3px 0px 0px #4F46E5' }}
        >
          <span className="font-display text-2xl font-bold text-navy block">3</span>
          <span className="text-xs text-navy/60 font-medium">cities</span>
        </div>
        <div
          className="flex-1 bg-white p-3 text-center border-2 border-navy"
          style={{ boxShadow: '3px 3px 0px 0px #10B981' }}
        >
          <span className="font-display text-2xl font-bold text-navy block">FREE</span>
          <span className="text-xs text-navy/60 font-medium">always</span>
        </div>
      </div>

      {/* Quick action buttons - Neo-Brutalist */}
      <div className="flex gap-3">
        <button
          onClick={() => handleClick('events')}
          className="flex-1 bg-terracotta text-sand py-3.5 font-bold text-center border-2 border-navy flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
          style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
        >
          Browse Events
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleClick('submit')}
          className="flex-1 bg-white text-navy py-3.5 font-bold text-center border-2 border-navy flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
          style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
        >
          <Calendar className="w-5 h-5" />
          Submit
        </button>
      </div>
    </div>
  )
}
