'use client'

import { useState, useEffect } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function MobileHero() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
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

  return (
    <div className="md:hidden relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-neutral-950">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-neutral-950 pointer-events-none" />

      {/* Floating Orbs - Ambient animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1 absolute -top-10 -right-10 scale-75" />
        <div className="floating-orb floating-orb-2 absolute top-1/2 -left-10 scale-50" />
        <div className="floating-orb floating-orb-3 absolute bottom-1/4 right-0 scale-50" />
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
        <div className="absolute inset-0 animated-gradient-dark opacity-50" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.6) 40%, rgba(10, 10, 10, 0.4) 70%, rgba(10, 10, 10, 0.3) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pb-24 pt-32">
        {/* Main headline */}
        <h1
          className="font-bold text-white mb-4"
          style={{
            fontSize: 'clamp(36px, 10vw, 48px)',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
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
          className="text-white/70 text-lg mb-8 max-w-xs"
          style={{
            lineHeight: '1.5',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s',
          }}
        >
          Morning runs. Sunset yoga. Weekend hikes. Find what moves you.
        </p>

        {/* Dual CTA Buttons */}
        <div
          className="w-full flex flex-col gap-3"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s',
          }}
        >
          <button
            onClick={() => handleClick('events-mobile')}
            className="w-full px-8 py-4 bg-white text-neutral-900 rounded-full font-semibold text-lg hover:bg-neutral-100 transition-colors text-center shadow-lg"
          >
            Explore events
          </button>
          <Link
            href="/host"
            className="w-full px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-colors text-center flex items-center justify-center gap-2"
          >
            Host your event
            <ArrowRight className="w-5 h-5" />
          </Link>
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

      {/* Bottom transition to gray-50 (matches HowItWorks bg) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, #F9FAFB, transparent)'
        }}
      />
    </div>
  )
}
