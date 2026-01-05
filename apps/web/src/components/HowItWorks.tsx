'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '1',
    title: 'Pick an event',
    description: "Run clubs, yoga, HIIT, beach workouts — filter by what you're into.",
  },
  {
    number: '2',
    title: 'Show up',
    description: 'No tryouts. No commitments. Just arrive at the time and place.',
  },
  {
    number: '3',
    title: 'Come back',
    description: 'The people you meet will make you want to.',
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
              className="text-center"
            >
              {/* Step Number */}
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
