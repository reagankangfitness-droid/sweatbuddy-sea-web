'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

// Helper to scroll to element with retry for dynamic content
const scrollToElement = (elementId: string, maxAttempts = 10) => {
  let attempts = 0

  const tryScroll = () => {
    const element = document.getElementById(elementId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      return true
    }

    attempts++
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 100)
    }
    return false
  }

  tryScroll()
}

const heroSlides = [
  {
    headline: "Find Your Crew.",
    subline: "Sweat Together.",
    image: "/images/hero-2.jpg",
    alt: "Outdoor yoga class in the park",
  },
  {
    headline: "Run Clubs.",
    subline: "New Friends. Same Pace.",
    image: "/images/hero-1.webp",
    alt: "Group fitness workout outdoors",
  },
  {
    headline: "Solo Gets Old.",
    subline: "Move With Others.",
    image: "/images/hero-3.jpg",
    alt: "Community workout session",
  },
]

// Memoized Hero component
export const Hero = memo(function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleHashClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    if (href.startsWith('#')) {
      const elementId = href.slice(1)

      if (pathname === '/') {
        scrollToElement(elementId)
      } else {
        router.push('/' + href)
      }
    }
  }, [pathname, router])

  const slide = heroSlides[currentSlide]

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-sand">
      {/* Navy background base */}
      <div className="absolute inset-0 bg-navy" />

      {/* Image Background Slideshow - Using CSS transitions instead of Framer Motion */}
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

        {/* Neo-Brutalist overlay - stronger left side for text */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 35%, rgba(15, 23, 42, 0.4) 65%, rgba(15, 23, 42, 0.2) 100%)'
          }}
        />

        {/* Terracotta accent glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 15% 60%, rgba(224, 122, 95, 0.4) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-container mx-auto w-full px-6 lg:px-10 py-20 md:py-32">
        <div className="max-w-4xl">
          {/* Animated headline - CSS animations */}
          <div
            key={currentSlide}
            className={`transition-opacity duration-400 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <h1
              className="font-display font-semibold text-sand mb-2"
              style={{
                fontSize: 'clamp(48px, 12vw, 96px)',
                lineHeight: '1',
                letterSpacing: '-0.04em',
                animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
              }}
            >
              {slide.headline}
            </h1>
            <h1
              className="font-display font-semibold text-terracotta mb-8"
              style={{
                fontSize: 'clamp(48px, 12vw, 96px)',
                lineHeight: '1',
                letterSpacing: '-0.04em',
                animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
              }}
            >
              {slide.subline}
            </h1>
          </div>

          {/* Subhead */}
          <p
            className="font-body text-sand/70 mb-10 max-w-xl"
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: '1.6',
              animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.3s both' : 'none',
            }}
          >
            Meet people who move like you. Open fitness events across Southeast Asia — where strangers become workout buddies.
          </p>

          {/* Stats - Neo-Brutalist style */}
          <div
            className="flex flex-wrap items-center gap-4 sm:gap-6 mb-10"
            style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.4s both' : 'none' }}
          >
            {[
              { value: '50+', label: 'events weekly' },
              { value: '3', label: 'cities' },
              { value: '1000+', label: 'connections' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex items-baseline gap-2 px-4 py-2 bg-sand/10 border-2 border-sand/20"
              >
                <span className="text-2xl sm:text-3xl font-display font-semibold text-sand">{stat.value}</span>
                <span className="text-sand/50 text-sm font-body">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs - Neo-Brutalist */}
          <div
            className="flex flex-col sm:flex-row items-start gap-4"
            style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}
          >
            <button
              onClick={(e) => handleHashClick(e, '#events')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-terracotta text-white font-semibold text-base border-2 border-sand transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px]"
              style={{
                boxShadow: '4px 4px 0px 0px #FAF7F2',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 0px 0px #FAF7F2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FAF7F2'
              }}
            >
              Browse Events
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Secondary as text link */}
            <p className="text-sm text-sand/50 font-body sm:self-center">
              Are you an organizer?{' '}
              <button
                onClick={(e) => handleHashClick(e, '#submit')}
                className="text-terracotta hover:text-coral underline underline-offset-4 transition-colors"
              >
                Submit your event
              </button>
            </p>
          </div>
        </div>

        {/* Slide indicators - Neo-Brutalist */}
        <div className="absolute bottom-32 left-6 lg:left-10 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 transition-all duration-300 border-2 hover:scale-110 active:scale-95 ${
                index === currentSlide
                  ? 'w-10 bg-terracotta border-sand'
                  : 'w-3 bg-transparent border-sand/30 hover:border-sand/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator - CSS animation */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
        style={{ animationDuration: '1.5s' }}
      >
        <span className="text-sand/40 text-xs uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-8 h-8 border-2 border-sand/30 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-sand/40" />
        </div>
      </div>

      {/* Bottom transition to sand */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #FAF7F2, transparent)'
        }}
      />
    </section>
  )
})
