'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function FinalCTA() {
  const handleClick = () => {
    const element = document.getElementById('events')
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative px-4 py-20 md:py-28 bg-gradient-to-b from-black to-neutral-950 text-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        {/* Icon badge */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          Your crew is already out there.
        </h2>
        <p className="text-xl text-gray-400 mt-4">
          You just haven&apos;t met them yet.
        </p>

        <motion.div
          className="mt-10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={handleClick}
            className="group relative inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-semibold shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300"
          >
            Find an Experience
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <span>50+ experiences weekly</span>
          </div>
          <div className="w-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <span>1000+ connections made</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
