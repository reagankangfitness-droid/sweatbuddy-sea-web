'use client'

import { motion } from 'framer-motion'
import { IPhoneMockup } from './IPhoneMockup'
import { CitySelector } from './screens/CitySelector'
import { EventBrowser } from './screens/EventBrowser'
import { EventDetail } from './screens/EventDetail'

const steps = [
  {
    number: '01',
    title: 'Pick Your City',
    description: 'Select where you\'re based. We\'re live in Singapore with more cities coming soon.',
    screen: <CitySelector />,
    color: '#E07A5F', // terracotta
  },
  {
    number: '02',
    title: 'Browse What\'s On',
    description: 'Filter by category, day, or vibe. Find events that match your style.',
    screen: <EventBrowser />,
    color: '#4F46E5', // electric
  },
  {
    number: '03',
    title: 'Just Show Up',
    description: 'No bookings, no sign-ups. Mark yourself as going and show up.',
    screen: <EventDetail />,
    color: '#10B981', // mint
  },
]

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden bg-cream">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-coral/5" />
      <div className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-teal/10" />
      <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-ocean/10" />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <h2
            className="font-display font-semibold text-forest-900"
            style={{
              fontSize: 'clamp(36px, 7vw, 64px)',
              letterSpacing: '-0.03em',
            }}
          >
            How It <span className="text-coral">Works</span>
          </h2>
          <p className="text-lg mt-4 max-w-xl mx-auto text-forest-600">
            Three steps to your next workout buddy
          </p>
        </motion.div>

        {/* Steps with iPhone Mockups */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-6 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* iPhone Mockup */}
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-8"
              >
                <IPhoneMockup>
                  {step.screen}
                </IPhoneMockup>
              </motion.div>

              {/* Step Number - Rounded */}
              <div
                className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl font-display font-semibold text-2xl text-white shadow-md"
                style={{
                  backgroundColor: step.color,
                }}
              >
                {step.number}
              </div>

              {/* Title */}
              <h3
                className="font-display font-semibold text-xl mb-3 text-forest-900"
                style={{ letterSpacing: '-0.02em' }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-body leading-relaxed max-w-[280px] text-forest-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
