'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatedCounter } from './ui/AnimatedCounter'

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
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-neutral-950">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Floating Orbs - Ambient animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1 absolute -top-20 -left-20" />
        <div className="floating-orb floating-orb-2 absolute top-1/3 right-10" />
        <div className="floating-orb floating-orb-3 absolute bottom-20 left-1/3" />
      </div>

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

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 animated-gradient-dark opacity-60" />

        {/* Premium minimalist gradient overlay - elegant, refined */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(10, 10, 10, 0.75) 0%, rgba(10, 10, 10, 0.5) 40%, rgba(10, 10, 10, 0.3) 70%, rgba(10, 10, 10, 0.2) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-content mx-auto w-full px-6 lg:px-10 py-20 md:py-32">
        <div className="max-w-2xl">
          {/* Animated headline - typography does all the work */}
          <div
            key={currentSlide}
            className={`transition-opacity duration-400 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <h1
              className="font-semibold text-white mb-2"
              style={{
                fontSize: 'clamp(40px, 10vw, 64px)',
                lineHeight: '1.05',
                letterSpacing: '-0.025em',
                animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
              }}
            >
              {slide.headline}
            </h1>
            <h1
              className="font-semibold text-white/80 mb-10"
              style={{
                fontSize: 'clamp(40px, 10vw, 64px)',
                lineHeight: '1.05',
                letterSpacing: '-0.025em',
                animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
              }}
            >
              {slide.subline}
            </h1>
          </div>

          {/* Subhead - clean, minimal */}
          <p
            className="text-white/60 mb-12 max-w-lg"
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              lineHeight: '1.7',
              animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.3s both' : 'none',
            }}
          >
            50+ fitness events happening in Singapore this week. Run clubs, yoga, HIIT, and more. No memberships. Just show up.
          </p>

          {/* Stats - clean, typographic hierarchy with animated counters */}
          <div
            className="flex flex-wrap items-center gap-8 mb-12"
            style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.4s both' : 'none' }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                <AnimatedCounter value={50} duration={1500} suffix="+" />
              </span>
              <span className="text-white/40 text-sm">events weekly</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                <AnimatedCounter value={3} duration={1000} />
              </span>
              <span className="text-white/40 text-sm">cities</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Updated</span>
              <span className="text-white/40 text-sm">weekly</span>
            </div>
          </div>

          {/* CTAs - clean, confident black button */}
          <div
            className="flex flex-col sm:flex-row items-start gap-5"
            style={{ animation: isLoaded ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}
          >
            <button
              onClick={(e) => handleHashClick(e, '#events')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-neutral-900 font-semibold text-base rounded-lg transition-all duration-250 hover:bg-neutral-100 active:scale-[0.98]"
            >
              Browse Events
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Secondary as subtle text link */}
            <p className="text-sm text-white/40 sm:self-center">
              Are you an organizer?{' '}
              <button
                onClick={(e) => handleHashClick(e, '#submit-desktop')}
                className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
              >
                Host your event
              </button>
            </p>
          </div>
        </div>

        {/* Slide indicators - minimal dots */}
        <div className="absolute bottom-32 left-6 lg:left-10 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator - subtle */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
        style={{ animationDuration: '2s' }}
      >
        <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-white/30" />
        </div>
      </div>

      {/* Bottom transition to white - subtle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #FFFFFF, transparent)'
        }}
      />
    </section>
  )
})
