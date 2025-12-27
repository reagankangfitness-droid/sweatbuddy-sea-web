'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StripeConnectSetup } from './StripeConnectSetup'

interface Event {
  id: string
  name: string
  category: string
  day: string
  date: string | null
  time: string
  location: string
  description?: string | null
  recurring?: boolean
  imageUrl?: string | null
  communityLink?: string | null
  contactEmail?: string
  // Pricing fields
  isFree?: boolean
  price?: number | null
  stripeEnabled?: boolean
}

interface EditEventFormProps {
  event: Event
}

const CATEGORIES = [
  'Running',
  'Run Club',
  'Cycling',
  'HIIT',
  'Swimming',
  'Dance Fitness',
  'Strength Training',
  'Bootcamp',
  'CrossFit',
  'Yoga',
  'Pilates',
  'Breathwork',
  'Meditation',
  'Hiking',
  'Outdoor Fitness',
  'Volleyball',
  'Pickleball',
  'Tennis',
  'Cold Plunge',
  'Wellness Circle',
  'Sweat Date',
  'Other'
]

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: event.name || '',
    category: event.category || '',
    day: event.day || '',
    date: event.date || '',
    time: event.time || '',
    location: event.location || '',
    description: event.description || '',
    recurring: event.recurring || false,
    communityLink: event.communityLink || '',
    // Pricing fields
    isFree: event.isFree ?? true,
    price: event.price ? (event.price / 100).toFixed(2) : '',
    stripeEnabled: event.stripeEnabled || false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        // Convert price to cents
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        stripeEnabled: !formData.isFree && formData.stripeEnabled,
      }

      const res = await fetch(`/api/host/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update event')
      }

      router.push('/host/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Event Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
          Event Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors bg-white"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Day */}
      <div>
        <label htmlFor="day" className="block text-sm font-medium text-neutral-700 mb-2">
          Day *
        </label>
        <input
          type="text"
          id="day"
          name="day"
          value={formData.day}
          onChange={handleChange}
          placeholder="e.g. Saturdays, 20/12/2025"
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
      </div>

      {/* Date & Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-2">
            Date (optional)
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-neutral-700 mb-2">
            Time *
          </label>
          <input
            type="text"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            placeholder="e.g. 7:00 AM"
            required
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
          Location *
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors resize-none"
        />
      </div>

      {/* Community Link */}
      <div>
        <label htmlFor="communityLink" className="block text-sm font-medium text-neutral-700 mb-2">
          Community Link (optional)
        </label>
        <input
          type="url"
          id="communityLink"
          name="communityLink"
          value={formData.communityLink}
          onChange={handleChange}
          placeholder="e.g., https://chat.whatsapp.com/..."
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <p className="text-xs text-neutral-400 mt-1">
          WhatsApp, Telegram, or Discord group link for attendees
        </p>
      </div>

      {/* Pricing Section */}
      <div className="pt-4 border-t border-neutral-200 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Pricing</h3>

        {/* Free or Paid Toggle */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isFree"
              checked={formData.isFree}
              onChange={() => setFormData(prev => ({ ...prev, isFree: true }))}
              className="w-4 h-4 text-neutral-900"
            />
            <span className="text-neutral-700">Free event</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isFree"
              checked={!formData.isFree}
              onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
              className="w-4 h-4 text-neutral-900"
            />
            <span className="text-neutral-700">Paid event</span>
          </label>
        </div>

        {/* Paid Event Options */}
        {!formData.isFree && (
          <div className="space-y-4">
            {/* Price Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Price (SGD) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="15.00"
                  className="w-full pl-8 px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-700">Payment method</p>

              {/* Card payments via Stripe */}
              <label className="flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.stripeEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, stripeEnabled: e.target.checked }))}
                  className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-neutral-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Card payments</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Stripe</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">Accept credit/debit cards - funds go directly to your bank</p>
                </div>
              </label>

              {/* Stripe Connect Setup */}
              {formData.stripeEnabled && (
                <StripeConnectSetup
                  eventId={event.id}
                  contactEmail={event.contactEmail || ''}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="recurring"
          name="recurring"
          checked={formData.recurring}
          onChange={handleChange}
          className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <label htmlFor="recurring" className="text-sm text-neutral-700">
          This event repeats weekly
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.push('/host/dashboard')}
          className="flex-1 px-6 py-3.5 border border-neutral-200 rounded-full font-semibold text-neutral-700 hover:border-neutral-400 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3.5 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
