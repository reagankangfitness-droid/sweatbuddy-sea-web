'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
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

export function Mission() {
  const pathname = usePathname()
  const router = useRouter()

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
    <section id="mission" className="relative py-24 md:py-36 overflow-hidden bg-neutral-950">
      {/* Decorative elements - subtle */}
      <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-white/5" />
      <div className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-neutral-900/10" />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Event types - Premium rounded cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {['Run clubs', 'Yoga flows', 'HIIT sessions', 'Beach bootcamps'].map((type) => (
              <div key={type} className="px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-cream/10">
                <span className="text-white font-medium">{type}</span>
              </div>
            ))}
          </motion.div>

          {/* Main message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg mb-8"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Hundreds of <span className="text-white font-medium">open workouts</span> happen every week — scattered across Instagram stories and Facebook groups.
          </motion.p>

          {/* Divider - subtle coral */}
          <div className="w-16 h-0.5 bg-neutral-900/50 mx-auto my-10" />

          {/* SweatBuddies value prop - Premium card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-4 px-8 py-5 bg-neutral-900 rounded-2xl shadow-lg mb-10"
          >
            <Zap className="w-6 h-6 text-white" />
            <span className="text-white font-sans font-semibold text-lg md:text-xl" style={{ letterSpacing: '-0.01em' }}>
              SweatBuddies finds them all. One place.
            </span>
          </motion.div>

          {/* CTA - Premium rounded */}
          <motion.button
            onClick={(e) => handleHashClick(e, '#events')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-900 text-ui-lg font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Just Show Up
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
