'use client'

import { motion } from 'framer-motion'

const props = [
  {
    title: 'Better than a gym',
    description: "Real people. Real accountability. Someone actually notices if you don't show up.",
  },
  {
    title: 'No membership required',
    description: 'Join once or join every week. No contracts. No commitments.',
  },
  {
    title: 'Across Singapore',
    description: "East Coast, Marina Bay, Sentosa, your neighborhood — something's happening near you.",
  },
]

export function ValueProps() {
  return (
    <section className="px-4 py-16 md:py-20 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-2xl md:text-3xl font-bold text-center mb-12"
        >
          Why SweatBuddies
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {props.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold mb-2">
                {prop.title}
              </h3>
              <p className="text-gray-400">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
