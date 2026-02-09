'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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

// Memoized Hero component
export const Hero = memo(function Hero() {
  const [isLoaded, setIsLoaded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
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

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-neutral-950">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-neutral-950 pointer-events-none" />

      {/* Floating Orbs - Ambient animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1 absolute -top-20 -left-20" />
        <div className="floating-orb floating-orb-2 absolute top-1/3 right-10" />
        <div className="floating-orb floating-orb-3 absolute bottom-20 left-1/3" />
      </div>

      {/* Image Background */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/images/hero-2.jpg"
          alt="Group fitness workout outdoors"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 animated-gradient-dark opacity-60" />

        {/* Premium minimalist gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(10, 10, 10, 0.8) 0%, rgba(10, 10, 10, 0.6) 40%, rgba(10, 10, 10, 0.4) 70%, rgba(10, 10, 10, 0.3) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-content mx-auto w-full px-6 lg:px-10 py-20 md:py-32">
        <div className="max-w-3xl">
          {/* Main headline */}
          <h1
            className="font-bold text-white mb-6"
            style={{
              fontSize: 'clamp(40px, 8vw, 72px)',
              lineHeight: '1.05',
              letterSpacing: '-0.025em',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s',
            }}
          >
            Show up alone.
            <br />
            <span className="text-white/90">Leave with a crew.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-white/70 mb-10 max-w-xl"
            style={{
              fontSize: 'clamp(18px, 2.5vw, 22px)',
              lineHeight: '1.6',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s',
            }}
          >
            Hundreds of group workouts across Singapore.<br />
            Zero DM hunting. One tap to join.
          </p>

          {/* Dual CTA Buttons */}
          <div
            className="flex flex-col gap-6"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s',
            }}
          >
            <div className="flex flex-wrap gap-4">
              <button
                onClick={(e) => handleHashClick(e, '#events')}
                className="px-10 py-5 bg-white text-neutral-900 rounded-full font-semibold text-lg hover:bg-neutral-100 transition-colors shadow-lg"
              >
                Explore experiences
              </button>
              <Link
                href="/host"
                className="px-10 py-5 bg-transparent text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-colors flex items-center gap-2"
              >
                Host your experience
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Host hook text */}
            <p className="text-white/50 text-sm">
              Already leading workouts?{' '}
              <Link href="/host" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">
                List yours here
              </Link>
            </p>
          </div>
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

      {/* Bottom transition to content background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-white dark:from-neutral-950 to-transparent"
      />
    </section>
  )
})
