'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

export function HostCTA() {
  return (
    <section className="px-4 py-16 md:py-24 bg-neutral-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Headline - problem-focused */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
          Stop juggling Instagram DMs,<br className="hidden sm:block" />
          Google Forms, and PayNow screenshots.
        </h2>

        {/* Subheadline */}
        <p className="mt-5 text-lg md:text-xl text-neutral-300">
          One place for signups, payments, and knowing who's actually showing up.
        </p>

        {/* CTA Button */}
        <motion.div
          className="mt-8"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/host"
            className="inline-flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-neutral-100 transition-colors"
          >
            Start hosting
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Benefits row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-400" />
            <span>Free to list</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-400" />
            <span>Collect payments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-400" />
            <span>Track attendance</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
