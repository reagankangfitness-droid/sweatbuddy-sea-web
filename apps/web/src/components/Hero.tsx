'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import Image from 'next/image'

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

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const slide = heroSlides[currentSlide]

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-sand">
      {/* Navy background base */}
      <div className="absolute inset-0 bg-navy" />

      {/* Image Background Slideshow */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={currentSlide === 0}
              loading={currentSlide === 0 ? 'eager' : 'lazy'}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

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
          {/* Animated headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0, 0, 1] }}
                className="font-display font-semibold text-sand mb-2"
                style={{
                  fontSize: 'clamp(48px, 12vw, 96px)',
                  lineHeight: '1',
                  letterSpacing: '-0.04em',
                }}
              >
                {slide.headline}
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0, 0, 1] }}
                className="font-display font-semibold text-terracotta mb-8"
                style={{
                  fontSize: 'clamp(48px, 12vw, 96px)',
                  lineHeight: '1',
                  letterSpacing: '-0.04em',
                }}
              >
                {slide.subline}
              </motion.h1>
            </motion.div>
          </AnimatePresence>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-sand/70 mb-10 max-w-xl"
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: '1.6',
            }}
          >
            Meet people who move like you. Open fitness events across Southeast Asia — where strangers become workout buddies.
          </motion.p>

          {/* Stats - Neo-Brutalist style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 sm:gap-6 mb-10"
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
          </motion.div>

          {/* CTAs - Neo-Brutalist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <motion.a
              href="#events"
              whileHover={{ x: -2, y: -2 }}
              whileTap={{ x: 2, y: 2 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-terracotta text-white font-semibold text-base border-2 border-sand transition-all duration-150"
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
            </motion.a>

            {/* Secondary as text link */}
            <p className="text-sm text-sand/50 font-body sm:self-center">
              Are you an organizer?{' '}
              <a
                href="#submit"
                className="text-terracotta hover:text-coral underline underline-offset-4 transition-colors"
              >
                Submit your event
              </a>
            </p>
          </motion.div>
        </div>

        {/* Slide indicators - Neo-Brutalist */}
        <div className="absolute bottom-32 left-6 lg:left-10 flex gap-2">
          {heroSlides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`h-3 transition-all duration-300 border-2 ${
                index === currentSlide
                  ? 'w-10 bg-terracotta border-sand'
                  : 'w-3 bg-transparent border-sand/30 hover:border-sand/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-sand/40 text-xs uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-8 h-8 border-2 border-sand/30 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-sand/40" />
        </div>
      </motion.div>

      {/* Bottom transition to sand */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #FAF7F2, transparent)'
        }}
      />
    </section>
  )
}
