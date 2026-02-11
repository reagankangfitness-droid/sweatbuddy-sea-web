'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Loader2, ImageIcon } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

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
  // Capacity fields
  maxSpots?: number | null
  isFull?: boolean
  currentAttendees?: number
}

interface EditEventFormProps {
  event: Event
}

const CATEGORIES = ACTIVITY_CATEGORIES
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map(c => c.name)

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(event.imageUrl || null)

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
    // Capacity fields
    maxSpots: event.maxSpots?.toString() || '',
    isFull: event.isFull || false,
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
        imageUrl,
        // Convert price to cents
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        // Capacity - convert to number or null
        maxSpots: formData.maxSpots ? parseInt(formData.maxSpots) : null,
      }

      const res = await fetch(`/api/host/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Couldn\'t save your changes. Try again?')
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
          What&apos;s your experience called? *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Saturday Morning Run Club"
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <p className="text-xs text-neutral-400 mt-1">Keep it short and specific</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
          What kind of workout is this? *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors bg-white"
        >
          <option value="">Pick a category</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <p className="text-xs text-neutral-400 mt-1">This helps people find you</p>
      </div>

      {/* Day */}
      <div>
        <label htmlFor="day" className="block text-sm font-medium text-neutral-700 mb-2">
          When does it happen? *
        </label>
        <input
          type="text"
          id="day"
          name="day"
          value={formData.day}
          onChange={handleChange}
          placeholder="e.g., Saturdays or Dec 20"
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
          Where should people meet? *
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., East Coast Park, Carpark C"
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <p className="text-xs text-neutral-400 mt-1">Be specific—it helps people find you</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
          Tell people what to expect
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="What will you do? Who's it for? What should they bring?"
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors resize-none"
        />
      </div>

      {/* Event Image */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Experience Image
        </label>
        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
            <Image
              src={imageUrl}
              alt="Experience preview"
              width={600}
              height={300}
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-neutral-900/70 hover:bg-neutral-900/90 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-xs text-white bg-neutral-900/70 px-3 py-1.5 rounded-lg inline-block">
                Click × to remove and upload a new image
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 border-dashed p-6">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="w-8 h-8 text-neutral-400" />
                <p className="text-sm text-neutral-500">Add a photo to make your event stand out</p>
                <UploadButton
                  endpoint="eventImage"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setIsUploading(false)
                    if (res?.[0]?.url) setImageUrl(res[0].url)
                  }}
                  onUploadError={(uploadError: Error) => {
                    setIsUploading(false)
                    setError(`Upload failed: ${uploadError.message}`)
                  }}
                  appearance={{
                    button: "bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-full text-sm transition-colors",
                    allowedContent: "hidden",
                  }}
                />
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-neutral-400 mt-2">
          Recommended: 1200×600px or larger, landscape orientation
        </p>
      </div>

      {/* Community Link - hidden for now */}

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

            {/* PayNow Payment Info */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-green-800">PayNow QR Code Payments</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Instant</span>
              </div>
              <p className="text-sm text-green-700">
                Add your PayNow QR code in the event settings. Attendees pay you directly with no fees - payments go straight to your account instantly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Capacity Section */}
      <div className="pt-4 border-t border-neutral-200 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Capacity</h3>

        {/* Current attendees info */}
        {event.currentAttendees !== undefined && (
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-900">{event.currentAttendees}</span> people registered
              {formData.maxSpots && (
                <span> / {formData.maxSpots} spots</span>
              )}
            </p>
          </div>
        )}

        {/* Max Spots */}
        <div>
          <label htmlFor="maxSpots" className="block text-sm font-medium text-neutral-700 mb-2">
            Maximum spots (optional)
          </label>
          <input
            type="number"
            id="maxSpots"
            name="maxSpots"
            min="1"
            value={formData.maxSpots}
            onChange={handleChange}
            placeholder="Leave empty for unlimited"
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <p className="text-xs text-neutral-400 mt-1">Registration closes automatically when full</p>
        </div>

        {/* Close Registration Toggle */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
          <div>
            <p className="font-medium text-neutral-900">Close registration</p>
            <p className="text-sm text-neutral-500">Manually stop accepting new signups</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isFull: !prev.isFull }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              formData.isFull ? 'bg-red-500' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                formData.isFull ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {formData.isFull && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            Registration is closed. New signups will be blocked.
          </p>
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
          This happens every week
        </label>
        <span className="text-xs text-neutral-400">(Regular events build loyal attendees)</span>
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
          disabled={isSubmitting || isUploading}
          className="flex-1 px-6 py-3.5 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving your changes...' : isUploading ? 'Uploading image...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
