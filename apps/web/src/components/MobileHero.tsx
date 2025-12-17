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
      <h1 className="font-display text-4xl font-bold leading-tight mb-3 text-forest-900" style={{ letterSpacing: '-0.02em' }}>
        Find Your Crew.
        <br />
        <span className="text-coral">Sweat Together.</span>
      </h1>

      <p className="text-forest-600 mb-6">
        Open fitness events across Southeast Asia. No memberships. Just show up.
      </p>

      {/* Stats Row - Premium Cards */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="font-display text-2xl font-bold text-coral block">50+</span>
          <span className="text-xs text-forest-500 font-medium">events</span>
        </div>
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="font-display text-2xl font-bold text-teal block">3</span>
          <span className="text-xs text-forest-500 font-medium">cities</span>
        </div>
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="font-display text-2xl font-bold text-ocean block">FREE</span>
          <span className="text-xs text-forest-500 font-medium">always</span>
        </div>
      </div>

      {/* Quick action buttons - Premium Rounded */}
      <div className="flex gap-3">
        <button
          onClick={() => handleClick('events')}
          className="flex-1 bg-coral text-white py-3.5 font-semibold text-center rounded-full flex items-center justify-center gap-2 shadow-md hover:bg-coral-600 active:shadow-sm transition-all"
        >
          Browse Events
          <ArrowRight className="w-5 h-5" />
        </button>
        <a
          href="#submit"
          className="flex-1 bg-cream text-forest-900 py-3.5 font-semibold text-center rounded-full border border-forest-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-forest-300 transition-all"
        >
          <Calendar className="w-5 h-5" />
          Submit
        </a>
      </div>
    </div>
  )
}
