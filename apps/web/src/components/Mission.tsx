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
    <section id="mission" className="relative py-24 md:py-36 overflow-hidden bg-forest-950">
      {/* Decorative elements - subtle */}
      <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-cream/5" />
      <div className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-coral/10" />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Stats - Premium rounded cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            <div className="px-6 py-4 bg-cream/10 backdrop-blur-sm rounded-2xl border border-cream/10">
              <span className="text-stat-sm text-cream">$200+</span>
              <span className="text-cream/50 text-sm ml-2">gym/month</span>
            </div>
            <div className="px-6 py-4 bg-cream/10 backdrop-blur-sm rounded-2xl border border-cream/10">
              <span className="text-stat-sm text-cream">$40+</span>
              <span className="text-cream/50 text-sm ml-2">per class</span>
            </div>
          </motion.div>

          {/* Main message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-body-large text-cream/70 mb-8"
          >
            But <span className="text-cream font-medium">100s of free sessions</span> happen every week — invisible, scattered across Facebook groups.
          </motion.p>

          {/* Divider - subtle coral */}
          <div className="w-16 h-0.5 bg-coral/50 mx-auto my-10" />

          {/* SweatBuddies value prop - Premium card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-4 px-8 py-5 bg-coral rounded-2xl shadow-lg mb-10"
          >
            <Zap className="w-6 h-6 text-white" />
            <span className="text-white font-display font-semibold text-lg md:text-xl" style={{ letterSpacing: '-0.01em' }}>
              SweatBuddies finds them all. One place.
            </span>
          </motion.div>

          {/* Closing line - premium typography */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-display-section text-cream mb-10"
          >
            The best friendships start at 6am.
          </motion.p>

          {/* CTA - Premium rounded */}
          <motion.button
            onClick={(e) => handleHashClick(e, '#events')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-cream text-forest-900 text-ui-lg font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Just Show Up
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
