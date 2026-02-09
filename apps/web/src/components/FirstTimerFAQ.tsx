'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What if I don\'t know anyone?',
    answer: "That's the point. Neither does anyone else on their first time. Hosts are used to new faces — you'll be welcomed.",
    emoji: '👋',
  },
  {
    question: 'What if I\'m not fit enough?',
    answer: "Most experiences are all levels. You set your own pace. No one's judging.",
    emoji: '💪',
  },
  {
    question: 'How much does it cost?',
    answer: 'Prices vary by experience. Every listing shows the price upfront — no surprises.',
    emoji: '💰',
  },
]

export function FirstTimerFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="px-4 py-16 md:py-20 bg-white">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10"
        >
          First time? 🤔
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full text-left p-5 rounded-2xl transition-all duration-300 ${
                  openIndex === index
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{faq.emoji}</span>
                    <h3 className="text-lg font-semibold">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 ${
                      openIndex === index ? 'text-white' : 'text-gray-400'
                    }`} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-white/80 leading-relaxed pl-11">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
