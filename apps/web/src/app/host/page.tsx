'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, Instagram, Mail, User, FileText, Loader2, CheckCircle, Users, Sparkles } from 'lucide-react'

const eventTypes = [
  'Run Club',
  'Yoga',
  'HIIT',
  'Cold Plunge',
  'Bootcamp',
  'Cycling',
  'Swimming',
  'Strength Training',
  'Dance',
  'Martial Arts',
  'Other',
]

export default function HostApplicationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    organizerName: '',
    instagramHandle: '',
    email: '',
    eventName: '',
    eventType: '',
    eventDay: '',
    eventTime: '',
    location: '',
    description: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/host-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-sand">
        <header className="fixed top-0 left-0 right-0 z-40 bg-sand/95 backdrop-blur-lg border-b border-forest-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-cream border border-forest-200"
              >
                <ArrowLeft className="w-5 h-5 text-forest-700" />
              </Link>
              <h1 className="text-xl font-display font-semibold text-forest-900">List Your Event</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-display text-display-section text-forest-900 mb-4">
              Application Submitted!
            </h2>
            <p className="text-body-default text-forest-600 mb-8">
              Thanks for your interest in listing your event on SweatBuddies! We'll review your submission and get back to you within 24 hours.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-coral text-white px-6 py-3 rounded-full font-semibold hover:bg-coral-600 transition-colors"
            >
              Back to Home
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-sand/95 backdrop-blur-lg border-b border-forest-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-cream border border-forest-200"
            >
              <ArrowLeft className="w-5 h-5 text-forest-700" />
            </Link>
            <h1 className="text-xl font-display font-semibold text-forest-900">List Your Event</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-label font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Free to list
            </div>
            <h2 className="font-display text-display-lg md:text-display-xl text-forest-900 mb-3">
              Grow Your Fitness Community
            </h2>
            <p className="text-body-lg text-forest-600 max-w-md mx-auto">
              Get discovered by thousands of fitness enthusiasts in Southeast Asia.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-cream rounded-2xl p-4 text-center border border-forest-100 shadow-card">
              <Users className="w-6 h-6 text-coral mx-auto mb-2" />
              <span className="text-ui text-forest-700">More Attendees</span>
            </div>
            <div className="bg-cream rounded-2xl p-4 text-center border border-forest-100 shadow-card">
              <Calendar className="w-6 h-6 text-coral mx-auto mb-2" />
              <span className="text-ui text-forest-700">Easy RSVPs</span>
            </div>
            <div className="bg-cream rounded-2xl p-4 text-center border border-forest-100 shadow-card">
              <Sparkles className="w-6 h-6 text-coral mx-auto mb-2" />
              <span className="text-ui text-forest-700">100% Free</span>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-cream rounded-2xl border border-forest-100 shadow-card p-6 space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Organizer Section */}
            <div className="space-y-4">
              <h3 className="text-label text-forest-500 uppercase tracking-wide">About You</h3>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                  <input
                    type="text"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleChange}
                    required
                    placeholder="@yourhandle"
                    className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-forest-200 my-6" />

            {/* Event Section */}
            <div className="space-y-4">
              <h3 className="text-label text-forest-500 uppercase tracking-wide">Your Event</h3>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="Saturday Morning Run Club"
                  className="w-full px-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                />
              </div>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Event Type *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 appearance-none"
                >
                  <option value="">Select a type...</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ui text-forest-700 mb-1.5">
                    Day *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                    <input
                      type="text"
                      name="eventDay"
                      value={formData.eventDay}
                      onChange={handleChange}
                      required
                      placeholder="Every Saturday"
                      className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ui text-forest-700 mb-1.5">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                    <input
                      type="text"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleChange}
                      required
                      placeholder="7:30 AM"
                      className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Marina Bay Sands, Singapore"
                    className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-forest-700 mb-1.5">
                  Description <span className="text-forest-400">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-forest-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about your event..."
                    className="w-full pl-10 pr-4 py-3 bg-sand border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-forest-900 placeholder:text-forest-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-coral text-white py-4 rounded-full font-semibold text-lg hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-body-xs text-forest-500 text-center">
              By submitting, you agree to our terms of service. We'll review your event and get back to you within 24 hours.
            </p>
          </motion.form>

          {/* Existing Host Login */}
          <div className="mt-8 text-center">
            <p className="text-body-small text-forest-600">
              Already a host?{' '}
              <Link href="/organizer" className="text-coral font-medium hover:underline">
                Sign in to your dashboard
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
