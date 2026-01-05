'use client'

import { motion } from 'framer-motion'

const faqs = [
  {
    question: '"What if I don\'t know anyone?"',
    answer: "That's the point. Neither does anyone else on their first time. Hosts are used to new faces — you'll be welcomed.",
  },
  {
    question: '"What if I\'m not fit enough?"',
    answer: "Most events are all levels. You set your own pace. No one's judging.",
  },
  {
    question: '"How much does it cost?"',
    answer: 'Many events are free. Some have a small fee. Every listing shows the price — no surprises.',
  },
]

export function FirstTimerFAQ() {
  return (
    <section className="px-4 py-16 md:py-20 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12"
        >
          First time?
        </motion.h2>

        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0, 0, 1] }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
