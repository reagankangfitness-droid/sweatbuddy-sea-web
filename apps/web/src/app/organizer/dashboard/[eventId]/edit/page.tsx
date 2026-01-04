'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'

const libraries: ('places')[] = ['places']

const CATEGORIES = [
  'Run Club',
  'Running',
  'Yoga',
  'HIIT',
  'Bootcamp',
  'Dance',
  'Dance Fitness',
  'Combat',
  'Outdoor',
  'Outdoor Fitness',
  'Hiking',
  'Meditation',
  'Breathwork',
]

const DAYS = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
  'Monthly',
  'Various',
]

interface EventData {
  id: string
  eventName: string
  category: string
  day: string
  eventDate: string | null
  time: string
  location: string
  latitude: number | null
  longitude: number | null
  placeId: string | null
  description: string | null
  imageUrl: string | null
  recurring: boolean
  organizerName: string
  organizerInstagram: string
  contactEmail: string
  status: string
  rejectionReason: string | null
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [event, setEvent] = useState<EventData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    eventName: '',
    category: '',
    day: '',
    eventDate: '',
    time: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    placeId: null as string | null,
    description: '',
    recurring: true,
  })

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setFormData(prev => ({
          ...prev,
          location: place.formatted_address || '',
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null,
          placeId: place.place_id || null,
        }))
      }
    }
  }, [autocomplete])

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Check session first
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Get event data
        const res = await fetch(`/api/organizer/events/${eventId}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to load event')
        }

        const data = await res.json()
        setEvent(data.event)
        setFormData({
          eventName: data.event.eventName,
          category: data.event.category,
          day: data.event.day,
          eventDate: data.event.eventDate ? data.event.eventDate.split('T')[0] : '',
          time: data.event.time,
          location: data.event.location,
          latitude: data.event.latitude,
          longitude: data.event.longitude,
          placeId: data.event.placeId,
          description: data.event.description || '',
          recurring: data.event.recurring,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update event')
      }

      setSuccess('Changes saved ✓ Your update is live.')
      setTimeout(() => {
        router.push('/organizer/dashboard')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete event')
      }

      router.push('/organizer/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#3477f8]" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Event not found</h2>
          <Link href="/organizer/dashboard" className="text-[#3477f8] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Static events can't be edited
  if (event.status === 'static') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Cannot Edit This Event</h2>
          <p className="text-neutral-600 mb-4">
            This event is managed by SweatBuddies and cannot be edited directly.
            Please contact us if you need to make changes.
          </p>
          <Link href="/organizer/dashboard" className="text-[#3477f8] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/organizer/dashboard"
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-neutral-900">Edit Event</h1>
            <p className="text-sm text-neutral-500">{event.eventName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600"
          >
            {success}
          </motion.div>
        )}

        {event.status === 'rejected' && event.rejectionReason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="font-semibold text-red-700 mb-1">Event Rejected</h3>
            <p className="text-sm text-red-600">{event.rejectionReason}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Event Details Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3477f8]" />
              Event Details
            </h2>

            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={150}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none resize-none"
                  placeholder="Brief description of your event..."
                />
                <span className="text-xs text-neutral-400 mt-1 block text-right">
                  {formData.description.length}/150
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#3477f8]" />
              Date & Time
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Day *
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                >
                  <option value="">Select day</option>
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  placeholder="e.g., 7:00 AM"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                />
              </div>

              {/* Event Date (optional) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Next Date
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                />
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-[#3477f8] focus:ring-[#3477f8]"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-neutral-700">
                  Recurring weekly
                </label>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#3477f8]" />
              Location
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Location *
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={setAutocomplete}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: 'sg' },
                    types: ['establishment', 'geocode'],
                  }}
                >
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="Search for a location..."
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-[#3477f8] text-white font-semibold rounded-xl hover:bg-[#2563eb] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="py-3 px-6 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Remove Event
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Remove this event?</h3>
                <p className="text-sm text-neutral-600">
                  &quot;{event.eventName}&quot; will be removed from SweatBuddies. Anyone who RSVP&apos;d won&apos;t be notified automatically—you might want to reach out to them.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition"
                >
                  Keep It
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Remove Event'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
