'use client'

import { motion } from 'framer-motion'

export function SocialProof() {
  return (
    <section className="px-4 py-16 md:py-20 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
          &ldquo;I showed up alone and left with a running group chat and brunch plans.&rdquo;
        </blockquote>
        <p className="text-gray-500 mt-4">
          — First-time runner at East Coast Park
        </p>
      </motion.div>
    </section>
  )
}
