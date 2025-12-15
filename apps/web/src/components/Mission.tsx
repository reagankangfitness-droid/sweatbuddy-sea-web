'use client'

import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'

export function Mission() {
  return (
    <section id="mission" className="relative py-24 md:py-36 overflow-hidden bg-navy">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 border-4 border-sand/10 rotate-12" />
      <div className="absolute bottom-20 right-16 w-16 h-16 bg-terracotta/20 rotate-45" />
      <div className="absolute top-1/3 right-10 w-8 h-8 bg-mint/20" />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Stats - Neo-Brutalist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            <div
              className="px-6 py-3 bg-sand border-2 border-sand"
              style={{ boxShadow: '4px 4px 0px 0px #E07A5F' }}
            >
              <span className="font-display font-semibold text-2xl text-navy">$200+</span>
              <span className="text-navy/60 text-sm ml-2">gym/month</span>
            </div>
            <div
              className="px-6 py-3 bg-sand border-2 border-sand"
              style={{ boxShadow: '4px 4px 0px 0px #4F46E5' }}
            >
              <span className="font-display font-semibold text-2xl text-navy">$40+</span>
              <span className="text-navy/60 text-sm ml-2">per class</span>
            </div>
          </motion.div>

          {/* Main message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl md:text-2xl text-sand/80 leading-relaxed mb-8"
          >
            But <span className="text-sand font-semibold">100s of free sessions</span> happen every week — invisible, scattered across Facebook groups.
          </motion.p>

          {/* Divider */}
          <div className="w-24 h-1 bg-terracotta mx-auto my-10" />

          {/* SweatBuddies value prop - Neo-Brutalist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-4 px-8 py-5 bg-terracotta border-2 border-sand mb-10"
            style={{ boxShadow: '6px 6px 0px 0px #FAF7F2' }}
          >
            <Zap className="w-7 h-7 text-sand" />
            <span className="text-sand font-display font-semibold text-lg md:text-xl">
              SweatBuddies finds them all. One place.
            </span>
          </motion.div>

          {/* Closing line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-2xl md:text-3xl text-sand font-display font-semibold mb-10"
            style={{ letterSpacing: '-0.02em' }}
          >
            The best friendships start at 6am.
          </motion.p>

          {/* CTA */}
          <motion.a
            href="#events"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ x: -2, y: -2 }}
            whileTap={{ x: 2, y: 2 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-mint text-navy font-semibold border-2 border-sand transition-all duration-150"
            style={{ boxShadow: '4px 4px 0px 0px #FAF7F2' }}
          >
            Just Show Up
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </div>
      </div>
    </section>
  )
}
