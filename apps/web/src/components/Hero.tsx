'use client'

import { useState, useEffect } from 'react'
import { GradientBackground } from './GradientBackground'
import { ChevronDown } from 'lucide-react'

const heroSlides = [
  {
    headline: "Your City's Moving.",
    subline: "Know Where.",
    video: '/hero-video.mp4',
    accent: 'teal' as const,
  },
  {
    headline: "Run Clubs.",
    subline: "Yoga. HIIT. Dance.",
    video: '/hero-video.mp4',
    accent: 'orange' as const,
  },
  {
    headline: "No Memberships.",
    subline: "Just Movement.",
    video: '/hero-video.mp4',
    accent: 'purple' as const,
  },
]

const accentColors = {
  teal: 'from-[#3CCFBB]',
  orange: 'from-[#F97316]',
  purple: 'from-[#B292E7]',
}

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const slide = heroSlides[currentSlide]

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Video Background with overlay */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.3)' }}
        >
          <source src={slide.video} type="video/mp4" />
        </video>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F]/80 via-[#080A0F]/60 to-[#080A0F]" />
      </div>

      {/* Animated gradient blobs */}
      <GradientBackground variant="hero" />

      {/* Content */}
      <div className="relative z-10 max-w-container mx-auto w-full px-6 lg:px-10 py-20 md:py-32">
        <div className="max-w-4xl">
          {/* Animated headline */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h1
              className="font-extrabold text-white mb-2"
              style={{
                fontSize: 'clamp(40px, 10vw, 80px)',
                lineHeight: '1',
                letterSpacing: '-0.03em',
              }}
            >
              {slide.headline}
            </h1>
            <h1
              className={`font-extrabold mb-8 text-gradient`}
              style={{
                fontSize: 'clamp(40px, 10vw, 80px)',
                lineHeight: '1',
                letterSpacing: '-0.03em',
              }}
            >
              {slide.subline}
            </h1>
          </div>

          {/* Subhead */}
          <p
            className={`text-white/70 mb-10 max-w-xl transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: '1.6',
            }}
          >
            The best open-access fitness events in Southeast Asia — curated weekly. No memberships. No bookings. Just show up.
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <a href="#events" className="btn-primary">
              <span>See What&apos;s On</span>
            </a>
            <a href="#submit" className="btn-gradient-border">
              <span>Submit an Event</span>
            </a>
          </div>

          {/* Trust bar */}
          <div
            className={`flex flex-wrap items-center gap-x-8 gap-y-3 transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gradient">50+</span>
              <span className="text-white/60 text-sm">events</span>
            </div>
            <div className="w-px h-6 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gradient">3</span>
              <span className="text-white/60 text-sm">cities</span>
            </div>
            <div className="w-px h-6 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gradient">20+</span>
              <span className="text-white/60 text-sm">organizers</span>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-32 left-6 lg:left-10 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? 'w-8 bg-[#3CCFBB]'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5 text-white/40" />
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080A0F] to-transparent pointer-events-none" />
    </section>
  )
}
