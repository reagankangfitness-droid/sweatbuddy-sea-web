'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, Instagram, Mail, User, FileText, Loader2, CheckCircle, Users, Sparkles, DollarSign, ImageIcon, X } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'

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
    // Pricing fields
    isFree: true,
    price: '',
    paynowEnabled: false,
    paynowNumber: '',
    paynowName: '',
    stripeEnabled: false,
  })
  const [paynowQrCode, setPaynowQrCode] = useState<string | null>(null)
  const [isUploadingQr, setIsUploadingQr] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Map form data to EventSubmission format for unified submission system
      const eventSubmissionData = {
        eventName: formData.eventName,
        category: formData.eventType,
        day: formData.eventDay,
        time: formData.eventTime,
        recurring: true, // Host applications are typically for recurring events
        location: formData.location,
        description: formData.description || '',
        organizerName: formData.organizerName,
        organizerInstagram: formData.instagramHandle.replace('@', ''),
        contactEmail: formData.email,
        // Pricing fields
        isFree: formData.isFree,
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        paynowEnabled: !formData.isFree && formData.paynowEnabled,
        paynowQrCode: paynowQrCode,
        paynowNumber: formData.paynowNumber || null,
        paynowName: formData.paynowName || null,
        stripeEnabled: !formData.isFree && formData.stripeEnabled,
      }

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventSubmissionData),
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
      <div className="min-h-screen bg-neutral-50">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </Link>
              <h1 className="text-xl font-sans font-semibold text-neutral-900">List Your Event</h1>
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
            <h2 className="font-sans text-display-section text-neutral-900 mb-4">
              Application Submitted!
            </h2>
            <p className="text-body-default text-neutral-600 mb-8">
              Thanks for your interest in listing your event on SweatBuddies! We&apos;ll review your submission and get back to you within 24 hours.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-neutral-900-600 transition-colors"
            >
              Back to Home
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <h1 className="text-xl font-sans font-semibold text-neutral-900">List Your Event</h1>
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
            <div className="inline-flex items-center gap-2 bg-neutral-900/10 text-neutral-900 px-4 py-2 rounded-full text-label font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              List in minutes
            </div>
            <h2 className="font-sans text-display-lg md:text-display-xl text-neutral-900 mb-3">
              Grow Your Fitness Community
            </h2>
            <p className="text-body-lg text-neutral-600 max-w-md mx-auto">
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
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Users className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">More Attendees</span>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Calendar className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">Easy RSVPs</span>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Sparkles className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">100% Free</span>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Organizer Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide">About You</h3>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleChange}
                    required
                    placeholder="@yourhandle"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 my-6" />

            {/* Event Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide">Your Event</h3>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="Saturday Morning Run Club"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Type *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 appearance-none"
                >
                  <option value="">Select a type...</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ui text-neutral-700 mb-1.5">
                    Day *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      name="eventDay"
                      value={formData.eventDay}
                      onChange={handleChange}
                      required
                      placeholder="Every Saturday"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ui text-neutral-700 mb-1.5">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleChange}
                      required
                      placeholder="7:30 AM"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Marina Bay Sands, Singapore"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Description <span className="text-neutral-400">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about your event..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 my-6" />

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </h3>

              {/* Free or Paid Toggle */}
              <div className="flex gap-4">
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer flex-1 transition-colors ${formData.isFree ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <input
                    type="radio"
                    name="pricingType"
                    checked={formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true }))}
                    className="w-5 h-5 text-neutral-900"
                  />
                  <div>
                    <span className="font-medium text-neutral-900">Open event</span>
                    <p className="text-sm text-neutral-500">Anyone can join</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer flex-1 transition-colors ${!formData.isFree ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <input
                    type="radio"
                    name="pricingType"
                    checked={!formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                    className="w-5 h-5 text-neutral-900"
                  />
                  <div>
                    <span className="font-medium text-neutral-900">Paid event</span>
                    <p className="text-sm text-neutral-500">Collect payments</p>
                  </div>
                </label>
              </div>

              {/* Paid Event Options */}
              {!formData.isFree && (
                <div className="space-y-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  {/* Price Input */}
                  <div>
                    <label className="block text-ui text-neutral-700 mb-1.5">
                      Price (SGD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                      <input
                        type="number"
                        name="price"
                        min="1"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="15.00"
                        required={!formData.isFree}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-neutral-700">Payment methods</p>

                    {/* PayNow Option */}
                    <label className="flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.paynowEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, paynowEnabled: e.target.checked }))}
                        className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-neutral-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">PayNow</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Singapore</span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">Bank transfer via QR code (you verify manually)</p>
                      </div>
                    </label>

                    {/* Card payments - Coming Soon */}
                    <div className="flex items-start gap-3 p-4 bg-neutral-100 border border-neutral-100 rounded-xl opacity-60">
                      <input
                        type="checkbox"
                        disabled
                        className="w-5 h-5 mt-0.5 rounded border-neutral-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-500">Card payments</span>
                          <span className="px-2 py-0.5 bg-neutral-200 text-neutral-500 text-xs rounded-full font-medium">Coming Soon</span>
                        </div>
                        <p className="text-sm text-neutral-400 mt-0.5">Accept credit/debit cards via Stripe</p>
                      </div>
                    </div>
                  </div>

                  {/* PayNow Details */}
                  {formData.paynowEnabled && (
                    <div className="p-4 bg-purple-50 rounded-xl space-y-4 border border-purple-100">
                      <p className="text-sm font-medium text-purple-900">PayNow Details</p>

                      <div>
                        <label className="block text-sm text-purple-800 mb-1">
                          PayNow Number (UEN or Mobile) *
                        </label>
                        <input
                          type="text"
                          name="paynowNumber"
                          value={formData.paynowNumber}
                          onChange={handleChange}
                          placeholder="+65 9XXX XXXX or UEN"
                          required={formData.paynowEnabled}
                          className="w-full h-10 px-4 rounded-lg bg-white border border-purple-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-purple-800 mb-1">
                          Name shown on PayNow *
                        </label>
                        <input
                          type="text"
                          name="paynowName"
                          value={formData.paynowName}
                          onChange={handleChange}
                          placeholder="JOHN DOE or COMPANY PTE LTD"
                          required={formData.paynowEnabled}
                          className="w-full h-10 px-4 rounded-lg bg-white border border-purple-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-xs text-purple-500 mt-1">
                          This helps attendees verify they&apos;re paying the right person
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-purple-800 mb-1">
                          PayNow QR Code <span className="text-purple-500">(optional)</span>
                        </label>
                        <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 text-center bg-white">
                          {paynowQrCode ? (
                            <div className="space-y-2">
                              <img
                                src={paynowQrCode}
                                alt="PayNow QR"
                                className="w-32 h-32 mx-auto object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setPaynowQrCode(null)}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : isUploadingQr ? (
                            <div className="py-4">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                              <p className="text-sm text-purple-600 mt-2">Uploading...</p>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 mx-auto text-purple-300 mb-2" />
                              <UploadButton
                                endpoint="paynowQrUploader"
                                onClientUploadComplete={(res) => {
                                  if (res?.[0]?.url) {
                                    setPaynowQrCode(res[0].url)
                                  }
                                  setIsUploadingQr(false)
                                }}
                                onUploadBegin={() => setIsUploadingQr(true)}
                                onUploadError={(error: Error) => {
                                  setIsUploadingQr(false)
                                  setError(`QR upload failed: ${error.message}`)
                                }}
                                appearance={{
                                  button: "bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-full text-sm transition-colors",
                                  allowedContent: "hidden",
                                }}
                              />
                              <p className="text-xs text-purple-500 mt-2">
                                Screenshot from your banking app
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fee Notice */}
                  <p className="text-xs text-neutral-400">
                    PayNow: No platform fees. You verify payments manually in your dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 text-white py-4 rounded-full font-semibold text-lg hover:bg-neutral-900-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

            <p className="text-body-xs text-neutral-500 text-center">
              By submitting, you agree to our terms of service. We&apos;ll review your event and get back to you within 24 hours.
            </p>
          </motion.form>

          {/* Existing Host Login */}
          <div className="mt-8 text-center">
            <p className="text-body-small text-neutral-600">
              Already a host?{' '}
              <Link href="/organizer" className="text-neutral-900 font-medium hover:underline">
                Sign in to your dashboard
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
