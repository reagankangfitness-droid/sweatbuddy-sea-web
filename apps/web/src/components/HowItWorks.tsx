'use client'

import { motion } from 'framer-motion'
import { IPhoneMockup } from './IPhoneMockup'
import { EventBrowser } from './screens/EventBrowser'
import { EventDetail } from './screens/EventDetail'
import { CitySelector } from './screens/CitySelector'

const steps = [
  {
    number: '1',
    title: 'Browse',
    description: "Runs, yoga, HIIT, hikes — something new every week.",
    screen: <EventBrowser />,
  },
  {
    number: '2',
    title: 'Show up',
    description: 'No tryouts. No commitments. Just you and the crew.',
    screen: <EventDetail />,
  },
  {
    number: '3',
    title: 'Keep going',
    description: 'The people you meet will bring you back.',
    screen: <CitySelector />,
  },
]


export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-28 overflow-hidden bg-gray-50">
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            How it works
          </h2>
        </motion.div>

        {/* Mobile: Vertical layout with phones */}
        <div className="md:hidden space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* iPhone Mockup */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="mb-6 scale-90"
              >
                <IPhoneMockup>
                  {step.screen}
                </IPhoneMockup>
              </motion.div>

              {/* Step Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-4">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </span>
                <span className="text-sm font-semibold text-gray-900">{step.title}</span>
              </div>

              {/* Description */}
              <p className="text-gray-600 max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Desktop: Horizontal layout with phones */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.15, ease: [0.2, 0, 0, 1] }}
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

              {/* Step Number */}
              <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-lg">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 max-w-[280px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
