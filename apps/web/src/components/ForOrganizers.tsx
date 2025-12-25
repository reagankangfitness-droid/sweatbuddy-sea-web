'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Megaphone, Users, Star, ArrowRight, Mail } from 'lucide-react'
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

const benefits = [
  {
    icon: Users,
    title: 'Get Discovered',
    description: 'Show up when people search for events in your area.',
    hasImage: true,
    image: '/images/connect-people.webp',
    badge: 'reach new people',
    accentColor: 'cyan',
  },
  {
    icon: Star,
    title: 'List in Minutes',
    description: "No forms, no approval delays. Your event goes live the same day.",
    hasImage: true,
    image: '/images/list-in-minutes.jpeg',
    badge: 'no hassle',
    accentColor: 'cyan',
  },
  {
    icon: Mail,
    title: 'Collect Emails Automatically',
    description: "Every \"I'm Going\" click captures their email. Build your community list without extra tools.",
    hasImage: true,
    image: '/images/attendees-dashboard.png',
    badge: 'build your list',
    accentColor: 'pink',
  },
]

export function ForOrganizers() {
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
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/organizers-bg.jpg"
          alt="Community fitness event"
          fill
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
        {/* Dark overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.85) 0%, rgba(13, 35, 71, 0.8) 50%, rgba(10, 22, 40, 0.9) 100%)'
          }}
        />
      </div>

      {/* Gradient accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(56, 189, 248, 0.3), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(37, 99, 235, 0.4), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
              }}
            >
              <Megaphone className="w-4 h-4" />
              <span>For Organizers</span>
            </motion.div>

            <h2
              className="font-sans font-extrabold text-white mb-6 tracking-wide"
              style={{ fontSize: 'clamp(32px, 6vw, 56px)' }}
            >
              You Bring the Energy. <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #38BDF8, #06B6D4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                We Bring the People.
              </span>
            </h2>

            <p className="font-sans text-white/70 text-lg mb-10 max-w-lg leading-relaxed">
              Running open sessions? Get discovered by people actively looking for their next workout.
            </p>

            <motion.button
              onClick={(e) => handleHashClick(e, '#submit-desktop')}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>List Your Event</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Right: Benefits */}
          <div className="space-y-5">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group rounded-2xl overflow-hidden transition-all duration-500 ${
                  benefit.hasImage ? 'p-0' : 'p-6'
                }`}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {benefit.hasImage && benefit.image ? (
                  // Special card with image - Gen Z aesthetic
                  <div className="relative">
                    {/* Image section */}
                    <div className="relative h-44 sm:h-52 overflow-hidden">
                      <Image
                        src={benefit.image}
                        alt={benefit.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {/* Gradient overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, rgba(10, 22, 40, 0.95) 0%, rgba(10, 22, 40, 0.4) 50%, transparent 100%)'
                        }}
                      />

                      {/* Floating badge - Gen Z style */}
                      <div className="absolute top-3 left-3">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                          }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            benefit.accentColor === 'pink' ? 'bg-pink-400' : 'bg-cyan-400'
                          }`} />
                          {benefit.badge}
                        </motion.div>
                      </div>
                    </div>

                    {/* Content section */}
                    <div className="p-5 -mt-6 relative z-10">
                      <div className="flex items-start gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: benefit.accentColor === 'pink'
                              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))'
                              : 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.3))',
                            border: benefit.accentColor === 'pink'
                              ? '1px solid rgba(236, 72, 153, 0.4)'
                              : '1px solid rgba(56, 189, 248, 0.4)',
                          }}
                        >
                          <benefit.icon className={`w-4 h-4 ${
                            benefit.accentColor === 'pink' ? 'text-pink-400' : 'text-cyan-400'
                          }`} />
                        </motion.div>
                        <div>
                          <h3 className="font-sans font-bold text-white text-base mb-1 tracking-wide">
                            {benefit.title}
                          </h3>
                          <p className="font-sans text-white/60 text-sm leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular benefit card
                  <div className="flex items-start gap-5">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.2))',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      <benefit.icon className="w-5 h-5 text-[#38BDF8]" />
                    </motion.div>
                    <div>
                      <h3 className="font-sans font-bold text-white text-lg mb-1.5 tracking-wide">
                        {benefit.title}
                      </h3>
                      <p className="font-sans text-white/60 text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
