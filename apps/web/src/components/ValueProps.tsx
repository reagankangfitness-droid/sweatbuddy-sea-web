'use client'

import { motion } from 'framer-motion'
import { Users, CalendarCheck, MapPin } from 'lucide-react'

const props = [
  {
    icon: Users,
    title: 'Better than a gym',
    description: "Real people. Real accountability. Someone actually notices if you don't show up.",
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    icon: CalendarCheck,
    title: 'No membership required',
    description: 'Join once or join every week. No contracts. No commitments.',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    icon: MapPin,
    title: 'Across Singapore',
    description: "East Coast, Marina Bay, Sentosa, your neighborhood — something's happening near you.",
    gradient: 'from-green-500 to-teal-500',
  },
]

export function ValueProps() {
  return (
    <section className="px-4 py-16 md:py-20 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-2xl md:text-3xl font-bold text-center mb-12"
        >
          Why SweatBuddies ✨
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {props.map((prop, index) => {
            const Icon = prop.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative group"
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${prop.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />

                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 h-full hover:border-white/20 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3">
                    {prop.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
