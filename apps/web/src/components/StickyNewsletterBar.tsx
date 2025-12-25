'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Check } from 'lucide-react'

export function StickyNewsletterBar() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Show bar after scrolling past hero section
  useEffect(() => {
    // Check if already subscribed or dismissed this session
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('newsletter_bar_dismissed')
      const subscribed = localStorage.getItem('newsletter_subscribed')
      if (dismissed || subscribed) {
        setIsDismissed(true)
        return
      }
    }

    const handleScroll = () => {
      const scrollY = window.scrollY
      // Show after scrolling 500px
      setIsVisible(scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) throw new Error('Failed to subscribe')

      setIsSubmitted(true)
      localStorage.setItem('newsletter_subscribed', 'true')

      // Auto-hide after success
      setTimeout(() => {
        setIsDismissed(true)
      }, 2000)
    } catch {
      // Silently fail - user can try again
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('newsletter_bar_dismissed', 'true')
  }

  if (isDismissed || !isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg safe-area-bottom">
      <div className="max-w-container mx-auto px-4 py-3">
        {isSubmitted ? (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">You&apos;re subscribed!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            {/* Dismiss button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Text */}
            <span className="text-sm text-neutral-600 hidden sm:block flex-shrink-0">
              Get weekly events in your inbox
            </span>
            <span className="text-sm text-neutral-600 sm:hidden flex-shrink-0">
              Weekly events
            </span>

            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#3477f8] focus:ring-1 focus:ring-[#3477f8]/20"
            />

            {/* Subscribe button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-4 bg-[#3477f8] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 flex items-center justify-center min-w-[90px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
