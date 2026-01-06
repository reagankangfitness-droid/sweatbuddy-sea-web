'use client'

import { motion } from 'framer-motion'
import { Search, Calendar, Heart } from 'lucide-react'

const steps = [
  {
    number: '1',
    icon: Search,
    title: 'Pick an event',
    description: "Run clubs, yoga, HIIT, beach workouts — filter by what you're into.",
    emoji: '🔍',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    number: '2',
    icon: Calendar,
    title: 'Show up',
    description: 'No tryouts. No commitments. Just arrive at the time and place.',
    emoji: '📍',
    color: 'from-orange-500 to-pink-500',
  },
  {
    number: '3',
    icon: Heart,
    title: 'Come back',
    description: 'The people you meet will make you want to.',
    emoji: '❤️',
    color: 'from-pink-500 to-rose-500',
  },
]

export function HowItWorks() {
  return (
    <section className="px-4 py-16 md:py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12"
        >
          How it works
        </motion.h2>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden relative">
          {/* Connecting line */}
          <div className="absolute left-7 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 via-orange-500 to-pink-500" />

          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.15, ease: [0.2, 0, 0, 1] }}
                  className="relative flex gap-5"
                >
                  {/* Step circle */}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Content card */}
                  <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step {step.number}</span>
                      <span>{step.emoji}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Desktop: Horizontal with arrows */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-8 relative">
            {/* Connecting arrows */}
            <div className="absolute top-14 left-[33%] right-[33%] flex items-center justify-around pointer-events-none">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-orange-300 origin-left"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-pink-300 origin-left ml-8"
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="text-center group"
                >
                  {/* Icon with gradient */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <Icon className="w-9 h-9 text-white" />
                  </motion.div>

                  {/* Step badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Step {step.number} {step.emoji}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
