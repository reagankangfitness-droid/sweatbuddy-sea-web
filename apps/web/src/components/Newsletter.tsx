'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Check, Loader2, Send } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate email
    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) throw new Error('Failed to subscribe')

      setIsSubmitted(true)
    } catch {
      setError('Something went wrong. Try again?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2">You&apos;re on the list! 🎉</h3>
                  <p className="text-gray-600">Every Wednesday. The workouts worth showing up for.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Icon */}
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg">
                    <Mail className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    Never miss the good stuff
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm">
                    Weekly picks: the events people are actually showing up to.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Your email"
                        className="flex-1 px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-gray-900 focus:bg-white focus:outline-none transition-all text-base"
                      />
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative bg-gray-900 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Subscribe
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-4"
                      >
                        {error}
                      </motion.p>
                    )}
                  </form>

                  <p className="text-gray-400 text-xs mt-5">
                    No spam. Unsubscribe anytime. 💌
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
