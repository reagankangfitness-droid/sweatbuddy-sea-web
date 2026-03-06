'use client'

import { useState } from 'react'
import { Clock, Check, Loader2, X } from 'lucide-react'

interface WaitlistButtonProps {
  eventId: string
  eventName: string
  fullWidth?: boolean
}

export function WaitlistButton({ eventId, eventName, fullWidth = false }: WaitlistButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState<number | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/event-waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, email, name: name || null }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setPosition(data.position)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success && position) {
    return (
      <div className={`bg-amber-950 border border-amber-800 rounded-xl p-4 text-center ${fullWidth ? 'w-full' : ''}`}>
        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">You&apos;re #{position} on the waitlist!</span>
        </div>
        <p className="text-sm text-amber-400">
          We&apos;ll email you if a spot opens up
        </p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-amber-500 text-white hover:bg-amber-600 ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Join Waitlist</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-neutral-950 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-900 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Join Waitlist</h2>
                <p className="text-sm text-neutral-500">{eventName}</p>
              </div>
            </div>

            <p className="text-sm text-neutral-400 mb-4">
              This experience is full, but you can join the waitlist. We&apos;ll notify you by email if a spot opens up!
            </p>

            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Join Waitlist
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
