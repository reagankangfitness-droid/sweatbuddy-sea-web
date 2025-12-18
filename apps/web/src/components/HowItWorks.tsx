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
  },
  {
    number: '02',
    title: 'Browse What\'s On',
    description: 'Filter by category, day, or vibe. Find events that match your style.',
    screen: <EventBrowser />,
  },
  {
    number: '03',
    title: 'Just Show Up',
    description: 'No bookings, no sign-ups. Mark yourself as going and show up.',
    screen: <EventDetail />,
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
        {/* Header - Premium Typography */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="text-label text-forest-500 mb-4 block">HOW IT WORKS</span>
          <h2 className="text-display-section md:text-display-hero">
            Three Simple Steps
          </h2>
          <p className="text-body-large mt-4 max-w-xl mx-auto">
            From discovery to workout buddy in minutes
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

              {/* Step Number - Neutral rounded badge */}
              <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-forest-900 text-cream font-display font-semibold text-xl shadow-sm">
                {step.number}
              </div>

              {/* Title - Premium typography */}
              <h3 className="text-display-card mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-body-small max-w-[280px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
