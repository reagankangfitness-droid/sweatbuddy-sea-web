'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EmailSignupForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      localStorage.setItem('signup_email', email)
      router.push('/app')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 text-base"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-base hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Enter'}
      </button>
      {error && <p className="text-red-300 text-sm mt-1 sm:col-span-2">{error}</p>}
    </form>
  )
}
