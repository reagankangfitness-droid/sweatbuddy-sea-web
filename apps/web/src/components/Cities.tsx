'use client'

import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import Image from 'next/image'

const cities = [
  {
    name: 'Singapore',
    status: 'active' as const,
    subtitle: '50+ events live',
    image: '/images/cities/singapore.jpg',
  },
  {
    name: 'Kuala Lumpur',
    status: 'coming' as const,
    subtitle: 'January 2025',
    image: '/images/cities/malaysia.jpg',
  },
  {
    name: 'Bangkok',
    status: 'coming' as const,
    subtitle: 'Q1 2025',
    image: '/images/cities/bangkok.jpg',
  },
]

export function Cities() {
  return (
    <section id="cities" className="relative py-24 md:py-36 overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.03) 0%, transparent 50%)' }} />

      {/* Gradient accents */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(56, 189, 248, 0.1))',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: '#2563EB',
            }}
          >
            <Globe className="w-4 h-4" />
            <span>Expanding Across SEA</span>
          </motion.div>
          <h2
            className="font-heading font-extrabold tracking-wide"
            style={{
              fontSize: 'clamp(32px, 6vw, 56px)',
              color: '#0A1628',
            }}
          >
            Where We&apos;re <span className="text-gradient">Live</span>
          </h2>
        </motion.div>

        {/* City Cards */}
        <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {cities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className={`group relative rounded-3xl overflow-hidden bg-white shadow-lg transition-shadow duration-500 hover:shadow-2xl ${
                city.status === 'active'
                  ? ''
                  : 'opacity-80 hover:opacity-100'
              }`}
              style={{
                border: city.status === 'active' ? '2px solid #2563EB' : '1px solid rgba(10, 22, 40, 0.1)',
              }}
            >
              {/* City Image */}
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </motion.div>

                {/* Overlay gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(10, 22, 40, 0.85) 0%, rgba(10, 22, 40, 0.3) 50%, transparent 100%)'
                  }}
                />

                {/* City name on image */}
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="font-heading font-bold text-white text-2xl mb-1 tracking-wide drop-shadow-lg">
                    {city.name}
                  </h3>
                  <p className="text-white/70 text-sm font-body">
                    {city.subtitle}
                  </p>
                </div>

                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  {city.status === 'active' ? (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #2563EB, #38BDF8)',
                        boxShadow: '0 4px 20px -5px rgba(37, 99, 235, 0.5)',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#0A1628',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Hover glow for active */}
              {city.status === 'active' && (
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: '0 0 60px -15px rgba(37, 99, 235, 0.4)',
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p style={{ color: '#0A1628', opacity: 0.6 }} className="text-sm">
            Want SweatBuddies in your city?{' '}
            <a
              href="#submit"
              className="font-semibold hover:underline underline-offset-4 transition-colors"
              style={{ color: '#2563EB' }}
            >
              Let us know
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
