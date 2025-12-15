'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { format } from 'date-fns'
import { Pencil, Trash2, X, Save, Calendar, Clock, MapPin, Instagram, ImageIcon, Check, Mail, User, Loader2 } from 'lucide-react'
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
  imageUrl: string | null
  recurring: boolean
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

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

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
  const [activeTab, setActiveTab] = useState<'live' | 'pending'>('live')
  const [events, setEvents] = useState<Event[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchEvents(), fetchSubmissions()])
    setLoading(false)
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch {
      toast.error('Failed to fetch events')
    }
  }

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/event-submissions?status=PENDING', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch {
      toast.error('Failed to fetch submissions')
    }
  }

  const handleDelete = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })

      if (response.ok) {
        toast.success('Event deleted')
        setEvents(events.filter(e => e.id !== event.id))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete event')
      }
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const handleSave = async () => {
    if (!editingEvent) return

    try {
      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
        },
        body: JSON.stringify(editingEvent),
      })

      if (response.ok) {
        toast.success('Event updated')
        setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e))
        setEditingEvent(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update event')
      }
    } catch {
      toast.error('Failed to update event')
    }
  }

  const handleSubmissionAction = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(submissionId)

      const response = await fetch(`/api/admin/event-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
        },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Event Management</h1>
        <p className="text-white/50 mt-1 text-sm sm:text-base">Manage live events and review submissions</p>
      </div>

        {/* Tabs - Full width on mobile */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-[0.98] ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Live ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors relative text-sm sm:text-base active:scale-[0.98] ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Pending
            {submissions.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                activeTab === 'pending' ? 'bg-white text-[#2563EB]' : 'bg-[#38BDF8] text-white'
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
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/50">No live events</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Mobile: Stack layout */}
                  <div className="block sm:hidden">
                    {/* Image - Full width on mobile */}
                    <div className="relative w-full h-40 bg-white/5">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      {/* Actions on image for mobile */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-2.5 bg-black/60 text-white rounded-lg active:scale-95"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="p-2.5 bg-red-600/80 text-white rounded-lg active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-base font-semibold text-white leading-tight">{event.name}</h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/70 whitespace-nowrap">
                          {event.category}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-white/60">
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
                    {/* Image */}
                    <div className="relative w-48 bg-white/5 flex-shrink-0">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[8rem] flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                            <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/70">
                              {event.category}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-white/60">
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
                            <p className="text-sm text-white/40 mt-2 line-clamp-1">{event.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Check className="w-12 h-12 text-[#38BDF8] mx-auto mb-4" />
                <p className="text-white/50">No pending submissions</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Image */}
                  {submission.imageUrl && (
                    <div className="relative h-40 sm:h-48 w-full bg-white/5">
                      <Image
                        src={submission.imageUrl}
                        alt={submission.eventName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    {/* Title and badges */}
                    <div className="flex flex-wrap items-start gap-2 mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">{submission.eventName}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400">
                          PENDING
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-white/10 text-white/70">
                          {submission.category}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {submission.description && (
                      <p className="text-white/60 mb-4 text-sm sm:text-base">{submission.description}</p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{submission.day} • {submission.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">{submission.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${submission.recurring ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
                          {submission.recurring ? 'Recurring' : 'One-time'}
                        </span>
                      </div>
                    </div>

                    {/* Organizer Info */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4 text-sm">
                        <div className="flex items-center gap-2 text-white/60">
                          <User className="w-4 h-4" />
                          <span>{submission.organizerName}</span>
                        </div>
                        <a
                          href={`https://instagram.com/${submission.organizerInstagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#38BDF8]"
                        >
                          <Instagram className="w-4 h-4" />
                          @{submission.organizerInstagram}
                        </a>
                        <a
                          href={`mailto:${submission.contactEmail}`}
                          className="flex items-center gap-1 text-white/60 break-all"
                        >
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          {submission.contactEmail}
                        </a>
                      </div>
                      <p className="text-xs text-white/40 mt-2">
                        Submitted {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>

                    {/* Actions - Full width buttons on mobile */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleSubmissionAction(submission.id, 'approve')}
                        disabled={processingId === submission.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
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

      {/* Edit Modal - Fullscreen on mobile */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/90 sm:bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-[#0A1628] sm:border sm:border-white/20 sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            {/* Sticky header */}
            <div className="sticky top-0 bg-[#0A1628] border-b border-white/10 p-4 sm:p-6 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Event</h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-2 text-white/60 hover:text-white active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Event Name</label>
                <input
                  type="text"
                  value={editingEvent.name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Category</label>
                <select
                  value={editingEvent.category}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Day & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Day</label>
                  <input
                    type="text"
                    value={editingEvent.day}
                    onChange={(e) => setEditingEvent({ ...editingEvent, day: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Time</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Location</label>
                <input
                  type="text"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Description</label>
                <textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#1800AD] resize-none text-base"
                />
              </div>

              {/* Organizer */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={editingEvent.organizer}
                  onChange={(e) => setEditingEvent({ ...editingEvent, organizer: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Event Image</label>
                {editingEvent.imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
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
                      className="absolute top-2 right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors active:scale-95"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 border-dashed rounded-lg">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-white/20" />
                        <UploadButton
                          endpoint="eventImage"
                          onUploadBegin={() => setIsUploading(true)}
                          onClientUploadComplete={(res) => {
                            setIsUploading(false)
                            if (res?.[0]?.url) {
                              setEditingEvent({ ...editingEvent, imageUrl: res[0].url })
                            }
                          }}
                          onUploadError={() => {
                            setIsUploading(false)
                            toast.error('Upload failed')
                          }}
                          appearance={{
                            button: "bg-gradient-to-r from-[#2563EB] to-[#38BDF8] hover:opacity-90 text-white font-medium px-6 py-3 rounded-lg text-base transition-all",
                            allowedContent: "hidden",
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
                <div className="mt-2">
                  <input
                    type="text"
                    value={editingEvent.imageUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, imageUrl: e.target.value || null })}
                    placeholder="Or paste image URL directly"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#1800AD]"
                  />
                </div>
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={editingEvent.recurring}
                  onChange={(e) => setEditingEvent({ ...editingEvent, recurring: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/5 border-white/20 text-[#38BDF8] focus:ring-[#38BDF8]"
                />
                <label htmlFor="recurring" className="text-base text-white/60">Recurring event</label>
              </div>

              {/* Save Buttons - Sticky on mobile */}
              <div className="sticky bottom-0 bg-[#0A1628] pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static border-t border-white/10 sm:border-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 px-4 py-3.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Save className="w-5 h-5" />
                    Save
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
