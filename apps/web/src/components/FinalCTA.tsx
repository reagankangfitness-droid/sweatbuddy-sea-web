'use client'

import { motion } from 'framer-motion'

export function FinalCTA() {
  const handleClick = () => {
    const element = document.getElementById('events')
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <section className="px-4 py-20 md:py-28 bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          Your crew is already out there.
        </h2>
        <p className="text-xl text-gray-400 mt-4">
          You just haven&apos;t met them yet.
        </p>
        <div className="mt-8">
          <button
            onClick={handleClick}
            className="inline-block bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Find an Event
          </button>
        </div>
      </motion.div>
    </section>
  )
}
