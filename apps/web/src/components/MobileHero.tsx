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
      {/* Premium headline with tight tracking */}
      <h1 className="text-display-hero mb-3">
        Find Your Crew.
        <br />
        <span className="text-coral">Sweat Together.</span>
      </h1>

      <p className="text-body-large mb-6">
        Open fitness events across Southeast Asia. No memberships. Just show up.
      </p>

      {/* Stats Row - Neutral numbers for premium feel */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="text-stat-sm block">50+</span>
          <span className="text-label-sm text-forest-500">EVENTS</span>
        </div>
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="text-stat-sm block">3</span>
          <span className="text-label-sm text-forest-500">CITIES</span>
        </div>
        <div className="flex-1 bg-cream p-3 text-center rounded-2xl border border-forest-100 shadow-card">
          <span className="text-stat-sm block">FREE</span>
          <span className="text-label-sm text-forest-500">ALWAYS</span>
        </div>
      </div>

      {/* Quick action buttons - Coral only for primary CTA */}
      <div className="flex gap-3">
        <button
          onClick={() => handleClick('events')}
          className="flex-1 bg-coral text-white py-3.5 text-ui-lg font-semibold text-center rounded-full flex items-center justify-center gap-2 shadow-md hover:bg-coral-600 active:shadow-sm transition-all"
        >
          Browse Events
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleClick('submit')}
          className="flex-1 bg-cream text-forest-700 py-3.5 text-ui-lg font-semibold text-center rounded-full border border-forest-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-forest-300 hover:bg-forest-50 transition-all"
        >
          <Calendar className="w-5 h-5 text-forest-400" />
          Submit
        </button>
      </div>
    </div>
  )
}
