'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import Image from 'next/image'
import { format } from 'date-fns'
import { Pencil, Trash2, X, Save, Calendar, Clock, MapPin, Instagram, ImageIcon, Check, Mail, User, Loader2, Upload, DollarSign, CreditCard, Link2, Users, Navigation } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'

interface Event {
  id: string
  name: string
  category: string
  day: string
  eventDate: string | null
  time: string
  location: string
  description: string | null
  organizer: string
  organizerName: string | null
  contactEmail: string | null
  imageUrl: string | null
  recurring: boolean
  // Payment fields
  isFree: boolean
  price: number | null
  paynowEnabled: boolean
  paynowQrCode: string | null
  paynowNumber: string | null
  // Community & capacity
  communityLink: string | null
  capacity: number | null
}

interface Submission {
  id: string
  eventName: string
  category: string
  day: string
  time: string
  recurring: boolean
  location: string
  description: string | null
  imageUrl: string | null
  organizerName: string
  organizerInstagram: string
  contactEmail: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const categories = [
  'Run Club', 'Running', 'Cycling', 'HIIT', 'Swimming', 'Dance Fitness',
  'Strength Training', 'Bootcamp', 'CrossFit', 'Hyrox', 'Functional Fitness',
  'Yoga', 'Pilates', 'Breathwork', 'Meditation',
  'Hiking', 'Climbing', 'Outdoor Fitness', 'Outdoor',
  'Volleyball', 'Pickleball', 'Tennis', 'Badminton', 'Basketball',
  'Cold Plunge', 'Sauna', 'Sound Bath', 'Wellness Circle',
  'Fitness Social', 'Sweat Date', 'Corporate Wellness',
  'Workshop', 'Retreat', 'Fitness Festival', 'Other'
]

export default function AdminEventsPage() {
  const { getToken, isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState<'live' | 'pending'>('live')
  const [events, setEvents] = useState<Event[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [missingCoordsCount, setMissingCoordsCount] = useState(0)

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }, [getToken])

  const fetchEvents = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/events', { headers })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else if (response.status === 401) {
        toast.error('Unauthorized - please sign in with an admin account')
      } else {
        toast.error(`Failed to fetch events: ${response.status}`)
      }
    } catch {
      toast.error('Failed to fetch events')
    }
  }, [getAuthHeaders])

  const fetchSubmissions = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/event-submissions?status=PENDING', { headers })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      } else if (response.status === 401) {
        toast.error('Unauthorized - please sign in with an admin account')
      } else {
        toast.error(`Failed to fetch submissions: ${response.status}`)
      }
    } catch {
      toast.error('Failed to fetch submissions')
    }
  }, [getAuthHeaders])

  const fetchGeocodeStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/geocode-events', { headers })
      if (response.ok) {
        const data = await response.json()
        setMissingCoordsCount(data.missingCoords || 0)
      }
    } catch {
      // Error handled silently
    }
  }, [getAuthHeaders])

  const fetchData = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    await Promise.all([fetchEvents(), fetchSubmissions(), fetchGeocodeStatus()])
    setLoading(false)
  }, [isLoaded, fetchEvents, fetchSubmissions, fetchGeocodeStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        toast.success('Experience deleted')
        setEvents(events.filter(e => e.id !== event.id))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete experience')
      }
    } catch {
      toast.error('Failed to delete experience')
    }
  }

  const handleSave = async () => {
    if (!editingEvent) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editingEvent),
      })

      if (response.ok) {
        toast.success('Experience updated')
        setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e))
        setEditingEvent(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update experience')
      }
    } catch {
      toast.error('Failed to update experience')
    }
  }

  const handleSubmissionAction = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(submissionId)
      const headers = await getAuthHeaders()

      const response = await fetch(`/api/admin/event-submissions/${submissionId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast.success(`Event ${action === 'approve' ? 'approved' : 'rejected'}`)
        setSubmissions(submissions.filter(s => s.id !== submissionId))
        if (action === 'approve') {
          fetchEvents()
        }
      } else {
        toast.error('Failed to update submission')
      }
    } catch {
      toast.error('Failed to update submission')
    } finally {
      setProcessingId(null)
    }
  }

  const handleGeocode = async () => {
    try {
      setIsGeocoding(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/geocode-events', {
        method: 'POST',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Geocoding complete')
        fetchGeocodeStatus()
      } else {
        toast.error('Failed to geocode events')
      }
    } catch {
      toast.error('Failed to geocode events')
    } finally {
      setIsGeocoding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-neutral-50">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Experience Management</h1>
          <p className="text-neutral-500 mt-1 text-sm sm:text-base">Manage live experiences and review submissions</p>
        </div>
        {missingCoordsCount > 0 && (
          <button
            onClick={handleGeocode}
            disabled={isGeocoding}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Geocode {missingCoordsCount} Experiences
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-[0.98] ${
            activeTab === 'live'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Live ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors relative text-sm sm:text-base active:scale-[0.98] ${
            activeTab === 'pending'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Pending
          {submissions.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              activeTab === 'pending' ? 'bg-white text-neutral-900' : 'bg-red-500 text-white'
            }`}>
              {submissions.length}
            </span>
          )}
        </button>
      </div>

      {/* Live Events Tab */}
      {activeTab === 'live' && (
        <div className="space-y-3 sm:space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <p className="text-neutral-500">No live experiences</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
              >
                {/* Mobile: Stack layout */}
                <div className="block sm:hidden">
                  <div className="relative w-full h-40 bg-neutral-100">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="p-2.5 bg-white/90 text-neutral-700 rounded-lg active:scale-95 shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="p-2.5 bg-red-500 text-white rounded-lg active:scale-95 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-semibold text-neutral-900 leading-tight">{event.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-600 whitespace-nowrap">
                        {event.category}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{event.day} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 flex-shrink-0" />
                        <span>@{event.organizer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Side-by-side layout */}
                <div className="hidden sm:flex">
                  <div className="relative w-48 bg-neutral-100 flex-shrink-0">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[8rem] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-neutral-900">{event.name}</h3>
                          <span className="px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-600">
                            {event.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{event.day}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Instagram className="w-3 h-3" />
                            <span>@{event.organizer}</span>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-neutral-400 mt-2 line-clamp-1">{event.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Submissions Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-3 sm:space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-neutral-500">No pending submissions</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
              >
                {submission.imageUrl && (
                  <div className="relative h-40 sm:h-48 w-full bg-neutral-100">
                    <Image
                      src={submission.imageUrl}
                      alt={submission.eventName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-start gap-2 mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">{submission.eventName}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">
                        PENDING
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-neutral-100 text-neutral-600">
                        {submission.category}
                      </span>
                    </div>
                  </div>

                  {submission.description && (
                    <p className="text-neutral-600 mb-4 text-sm sm:text-base">{submission.description}</p>
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{submission.day} • {submission.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">{submission.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${submission.recurring ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {submission.recurring ? 'Recurring' : 'One-time'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4 text-sm">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <User className="w-4 h-4" />
                        <span>{submission.organizerName}</span>
                      </div>
                      <a
                        href={`https://instagram.com/${submission.organizerInstagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Instagram className="w-4 h-4" />
                        @{submission.organizerInstagram}
                      </a>
                      <a
                        href={`mailto:${submission.contactEmail}`}
                        className="flex items-center gap-1 text-neutral-500 break-all"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        {submission.contactEmail}
                      </a>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">
                      Submitted {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => handleSubmissionAction(submission.id, 'approve')}
                      disabled={processingId === submission.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
                    >
                      {processingId === submission.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleSubmissionAction(submission.id, 'reject')}
                      disabled={processingId === submission.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white sm:border sm:border-neutral-200 sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 sm:p-6 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Edit Experience</h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-2 text-neutral-500 hover:text-neutral-700 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Experience Name</label>
                <input
                  type="text"
                  value={editingEvent.name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">Category</label>
                <select
                  value={editingEvent.category}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Day</label>
                  <input
                    type="text"
                    value={editingEvent.day}
                    onChange={(e) => setEditingEvent({ ...editingEvent, day: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">Location</label>
                <input
                  type="text"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">Description</label>
                <textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={editingEvent.organizer}
                  onChange={(e) => setEditingEvent({ ...editingEvent, organizer: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">Experience Image</label>
                {editingEvent.imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                    <Image
                      src={editingEvent.imageUrl}
                      alt="Event preview"
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, imageUrl: null })}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors active:scale-95"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">Click × to change image</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 border-dashed p-6">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-neutral-400" />
                        <p className="text-sm text-neutral-500">Upload an image for this experience</p>
                        <UploadButton
                          endpoint="eventImage"
                          onUploadBegin={() => setIsUploading(true)}
                          onClientUploadComplete={(res) => {
                            setIsUploading(false)
                            if (res?.[0]?.url) {
                              setEditingEvent({ ...editingEvent, imageUrl: res[0].url })
                              toast.success('Image uploaded')
                            }
                          }}
                          onUploadError={(err: Error) => {
                            setIsUploading(false)
                            toast.error(`Upload failed: ${err.message}`)
                          }}
                          appearance={{
                            button: "bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors",
                            allowedContent: "hidden",
                          }}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-neutral-400 mb-2">Or paste an image URL:</p>
                          <input
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            onBlur={(e) => {
                              if (e.target.value) {
                                setEditingEvent({ ...editingEvent, imageUrl: e.target.value })
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={editingEvent.recurring}
                  onChange={(e) => setEditingEvent({ ...editingEvent, recurring: e.target.checked })}
                  className="w-5 h-5 rounded bg-white border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="recurring" className="text-base text-neutral-600">Recurring experience</label>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-200 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Settings
                </h3>

                {/* Free/Paid Toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={editingEvent.isFree}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      isFree: e.target.checked,
                      // Reset price if marking as free
                      price: e.target.checked ? null : editingEvent.price
                    })}
                    className="w-5 h-5 rounded bg-white border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <label htmlFor="isFree" className="text-base text-neutral-600">Free experience</label>
                </div>

                {/* Price (only show if not free) */}
                {!editingEvent.isFree && (
                  <div className="mb-4">
                    <label className="block text-sm text-neutral-600 mb-1">Price (in cents, e.g., 1500 = $15.00)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="number"
                        value={editingEvent.price || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="1500"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                      />
                    </div>
                    {editingEvent.price && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Display price: ${(editingEvent.price / 100).toFixed(2)} SGD
                      </p>
                    )}
                  </div>
                )}

                {/* PayNow Toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="paynowEnabled"
                    checked={editingEvent.paynowEnabled}
                    onChange={(e) => setEditingEvent({ ...editingEvent, paynowEnabled: e.target.checked })}
                    className="w-5 h-5 rounded bg-white border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <label htmlFor="paynowEnabled" className="text-base text-neutral-600">Enable PayNow payments</label>
                </div>

                {/* PayNow Details (only show if enabled) */}
                {editingEvent.paynowEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-200 bg-purple-50/50 p-4 rounded-r-lg">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">PayNow QR Code</label>
                      {editingEvent.paynowQrCode ? (
                        <div className="relative inline-block">
                          <Image
                            src={editingEvent.paynowQrCode}
                            alt="PayNow QR"
                            width={120}
                            height={120}
                            className="rounded-lg border border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingEvent({ ...editingEvent, paynowQrCode: null })}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <UploadButton
                            endpoint="eventImage"
                            onUploadBegin={() => setIsUploading(true)}
                            onClientUploadComplete={(res) => {
                              setIsUploading(false)
                              if (res?.[0]?.url) {
                                setEditingEvent({ ...editingEvent, paynowQrCode: res[0].url })
                                toast.success('QR code uploaded')
                              }
                            }}
                            onUploadError={(err: Error) => {
                              setIsUploading(false)
                              toast.error(`Upload failed: ${err.message}`)
                            }}
                            appearance={{
                              button: "bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors",
                              allowedContent: "hidden",
                            }}
                          />
                          <span className="text-xs text-neutral-500">Or paste URL:</span>
                          <input
                            type="text"
                            value={editingEvent.paynowQrCode || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, paynowQrCode: e.target.value })}
                            placeholder="https://utfs.io/f/..."
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">PayNow Number/UEN</label>
                      <input
                        type="text"
                        value={editingEvent.paynowNumber || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, paynowNumber: e.target.value })}
                        placeholder="91234567 or 12345678X"
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Community & Capacity Section */}
              <div className="border-t border-neutral-200 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community & Capacity
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Community Link (WhatsApp/Telegram)</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={editingEvent.communityLink || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, communityLink: e.target.value })}
                        placeholder="https://chat.whatsapp.com/... or https://t.me/..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Capacity (leave empty for unlimited)</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="number"
                        value={editingEvent.capacity || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="20"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static border-t border-neutral-200 sm:border-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 px-4 py-3.5 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
