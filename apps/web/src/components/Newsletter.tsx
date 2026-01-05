'use client'

import { useState } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

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
    <section className="relative py-16 md:py-20 overflow-hidden bg-gray-100">
      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            {isSubmitted ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-gray-900" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">You&apos;re on the list!</h3>
                <p className="text-gray-600">Every Wednesday. The workouts worth showing up for.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900">
                  Get the best events in your inbox
                </h3>
                <p className="text-gray-600 mt-2">
                  Every Wednesday. One email. The workouts worth showing up for.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Your email"
                    className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-base"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </form>
                {error && (
                  <p className="text-red-500 text-sm mt-4">{error}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
