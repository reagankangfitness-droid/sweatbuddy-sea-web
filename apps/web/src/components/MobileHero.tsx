'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowDown } from 'lucide-react'
import Image from 'next/image'

const heroSlides = [
  {
    headline: "Every Community Workout.",
    subline: "One Place.",
    image: "/images/hero-2.jpg",
    alt: "Outdoor yoga class in the park",
  },
  {
    headline: "Run Clubs.",
    subline: "Yoga. HIIT. More.",
    image: "/images/hero-1.webp",
    alt: "Group fitness workout outdoors",
  },
  {
    headline: "No Memberships.",
    subline: "Just Show Up.",
    image: "/images/hero-3.jpg",
    alt: "Community workout session",
  },
]

export function MobileHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleClick = (href: string) => {
    const scrollToElement = (attempts = 0) => {
      const element = document.getElementById(href)
      if (element) {
        const top = element.getBoundingClientRect().top + window.scrollY - 20
        window.scrollTo({ top, behavior: 'smooth' })
      } else if (attempts < 10) {
        setTimeout(() => scrollToElement(attempts + 1), 100)
      }
    }
    scrollToElement()
  }

  const slide = heroSlides[currentSlide]

  return (
    <div className="md:hidden relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-neutral-950">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Image Background Slideshow */}
      <div className="absolute inset-0">
        {heroSlides.map((s, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{
              opacity: currentSlide === index ? 1 : 0,
              transform: currentSlide === index ? 'scale(1)' : 'scale(1.05)',
              transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
            }}
          >
            <Image
              src={s.image}
              alt={s.alt}
              fill
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

        {/* Gradient overlay - matches desktop */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(10, 10, 10, 0.85) 0%, rgba(10, 10, 10, 0.5) 40%, rgba(10, 10, 10, 0.3) 70%, rgba(10, 10, 10, 0.2) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pb-24 pt-32">
        {/* Animated headline */}
        <div
          key={currentSlide}
          className={`transition-opacity duration-400 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <h1
            className="font-semibold text-white mb-1"
            style={{
              fontSize: 'clamp(36px, 10vw, 48px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
            }}
          >
            {slide.headline}
          </h1>
          <h1
            className="font-semibold text-white/80 mb-6"
            style={{
              fontSize: 'clamp(36px, 10vw, 48px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
            }}
          >
            {slide.subline}
          </h1>
        </div>

        {/* Subhead */}
        <p
          className="text-white/60 text-base mb-8 max-w-xs"
          style={{
            lineHeight: '1.6',
            animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.3s both' : 'none',
          }}
        >
          50+ fitness events in Singapore this week. Run clubs, yoga, HIIT, and more. Just show up.
        </p>

        {/* Stats - matches desktop inline style */}
        <div
          className="flex flex-wrap items-center gap-6 mb-8"
          style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.4s both' : 'none' }}
        >
          {[
            { value: '50+', label: 'events weekly' },
            { value: '3', label: 'cities' },
            { value: 'Updated', label: 'weekly' },
          ].map((stat, idx) => (
            <div key={idx} className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white tracking-tight">{stat.value}</span>
              <span className="text-white/40 text-sm">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* CTAs - matches desktop */}
        <div
          className="flex flex-col items-start gap-4"
          style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}
        >
          <button
            onClick={() => handleClick('events')}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-neutral-900 font-semibold text-base rounded-lg transition-all duration-250 hover:bg-neutral-100 active:scale-[0.98]"
          >
            Browse Events
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm text-white/40">
            Are you an organizer?{' '}
            <button
              onClick={() => handleClick('submit-mobile')}
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              Host your event
            </button>
          </p>
        </div>

        {/* Slide indicators - minimal dots */}
        <div className="flex gap-2 mt-8">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10"
        style={{ animationDuration: '2s' }}
      >
        <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-white/30" />
        </div>
      </div>

      {/* Bottom transition to white - matches desktop */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, #FFFFFF, transparent)'
        }}
      />
    </div>
  )
}
