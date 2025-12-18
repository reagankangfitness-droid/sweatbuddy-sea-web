'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instagram, Mail, Loader2, ArrowRight, Users, MessageCircle, Calendar } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function OrganizerPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/organizer/verify', { method: 'POST' })
        if (response.ok) {
          router.push('/organizer/dashboard')
        }
      } catch {
        // Not logged in
      } finally {
        setIsCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/organizer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send login link')
      }

      setSuccess('Check your email for a magic login link!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/organizer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, instagramHandle, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      // Auto-send login link after registration
      const loginResponse = await fetch('/api/organizer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        // Registration succeeded but email failed - still show partial success
        console.error('Failed to send magic link:', loginData.error)
        setSuccess('Registration complete! Please use the Login tab to request your magic link.')
        return
      }

      setSuccess('Registration complete! Check your email for a login link.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-lg border-b border-forest-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-display font-semibold text-lg text-forest-900">SweatBuddies</span>
          </Link>
          <Link
            href="/"
            className="text-ui text-forest-600 hover:text-coral transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-display-lg md:text-display-xl text-forest-900 mb-4"
            >
              Organizer Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-body-lg text-forest-600 max-w-2xl mx-auto"
            >
              Manage your events, connect with attendees, and grow your fitness community
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-cream rounded-2xl p-6 shadow-card border border-forest-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-coral" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-forest-900 mb-1">View Your Events</h3>
                    <p className="text-body-small text-forest-600">
                      See all events you&apos;re organizing with attendance counts and details
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream rounded-2xl p-6 shadow-card border border-forest-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-teal" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-forest-900 mb-1">Manage Attendees</h3>
                    <p className="text-body-small text-forest-600">
                      View who&apos;s signed up for your events and their contact information
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream rounded-2xl p-6 shadow-card border border-forest-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ocean/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-ocean" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-forest-900 mb-1">Direct Messaging</h3>
                    <p className="text-body-small text-forest-600">
                      Chat directly with attendees to answer questions and share updates
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-cream rounded-2xl p-8 shadow-card border border-forest-100"
            >
              {/* Tabs */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className={`flex-1 py-2.5 text-ui font-medium rounded-full transition ${
                    mode === 'login'
                      ? 'bg-coral text-white shadow-md'
                      : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                  className={`flex-1 py-2.5 text-ui font-medium rounded-full transition ${
                    mode === 'register'
                      ? 'bg-coral text-white shadow-md'
                      : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
                  }`}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-coral/10 border border-coral/20 rounded-xl text-coral text-body-small">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-xl text-teal text-body-small">
                  {success}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-ui text-forest-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:ring-2 focus:ring-coral/50 focus:border-coral outline-none text-forest-900 placeholder:text-forest-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Login Link
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-body-xs text-forest-500 text-center">
                    We&apos;ll send a magic link to your email
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-ui text-forest-700 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-sand border border-forest-200 rounded-xl focus:ring-2 focus:ring-coral/50 focus:border-coral outline-none text-forest-900 placeholder:text-forest-400"
                    />
                  </div>

                  <div>
                    <label className="block text-ui text-forest-700 mb-1.5">
                      Instagram Handle
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="yourhandle"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:ring-2 focus:ring-coral/50 focus:border-coral outline-none text-forest-900 placeholder:text-forest-400"
                      />
                    </div>
                    <p className="mt-1 text-body-xs text-forest-500">
                      Must match the handle on your events
                    </p>
                  </div>

                  <div>
                    <label className="block text-ui text-forest-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:ring-2 focus:ring-coral/50 focus:border-coral outline-none text-forest-900 placeholder:text-forest-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Register as Organizer
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-body-xs text-forest-500 text-center">
                    By registering, you confirm you organize events with this Instagram handle
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
