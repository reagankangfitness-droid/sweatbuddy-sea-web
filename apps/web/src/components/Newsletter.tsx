'use client'

import { useState } from 'react'
import { Mail, Check, Loader2, Sparkles } from 'lucide-react'

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
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F18] to-[#080A0F]" />

      {/* Gradient accents */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(25 95% 53% / 0.4), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(168 58% 52% / 0.4), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-sm font-medium mb-6">
            <Mail className="w-4 h-4" />
            <span>Newsletter</span>
          </div>

          <h2
            className="font-heading font-extrabold text-white mb-4 tracking-wide"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Get the <span className="text-gradient-energy">Weekly Drop</span>
          </h2>

          <p className="font-body text-white/50 text-lg mb-10">
            Every Wednesday. The best events. Your inbox.
          </p>

          {isSubmitted ? (
            <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3CCFBB]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#3CCFBB]" />
              </div>
              <h3 className="font-heading font-bold text-white text-xl mb-2 tracking-wide">You&apos;re in!</h3>
              <p className="font-body text-white/50">Check your inbox for a confirmation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full h-14 pl-12 pr-4 rounded-2xl input-dark text-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary h-14 px-8 disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm mt-4">{error}</p>
              )}

              <p className="text-white/30 text-xs mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
