'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Clock,
  Check,
  X,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  Inbox
} from 'lucide-react'

// Mock pending events - in a real app, these would come from an API
const mockPendingEvents = [
  {
    id: 'pending-1',
    title: 'Morning Yoga at Marina Bay',
    organizer: 'Yoga SG',
    organizerEmail: 'hello@yogasg.com',
    date: '2024-12-15',
    time: '07:00',
    location: 'Marina Bay Sands',
    description: 'Start your day with a peaceful yoga session overlooking the bay.',
    category: 'Yoga',
    submittedAt: '2024-12-04T10:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  },
  {
    id: 'pending-2',
    title: 'Beach Volleyball Tournament',
    organizer: 'SG Sports Club',
    organizerEmail: 'events@sgsports.sg',
    date: '2024-12-20',
    time: '09:00',
    location: 'East Coast Park',
    description: 'Friendly beach volleyball tournament for all skill levels.',
    category: 'Sports',
    submittedAt: '2024-12-03T15:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop',
  },
]

interface PendingEvent {
  id: string
  title: string
  organizer: string
  organizerEmail: string
  date: string
  time: string
  location: string
  description: string
  category: string
  submittedAt: string
  imageUrl?: string
}

export default function PendingEventsPage() {
  const [events, setEvents] = useState<PendingEvent[]>(mockPendingEvents)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (eventId: string) => {
    setProcessingId(eventId)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setEvents(events.filter(e => e.id !== eventId))
    toast.success('Event approved and published!')
    setProcessingId(null)
  }

  const handleReject = async (eventId: string) => {
    setProcessingId(eventId)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setEvents(events.filter(e => e.id !== eventId))
    toast.success('Event rejected')
    setProcessingId(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Pending Events</h1>
        <p className="text-white/50 mt-1">Review and approve submitted events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{events.length}</p>
              <p className="text-xs text-white/50">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-xs text-white/50">Approved Today</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:block bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-white/50">Rejected Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Events List */}
      {events.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-12 text-center">
          <Inbox className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
          <p className="text-white/50">No pending events to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="lg:w-48 h-32 lg:h-auto relative flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-yellow-500/90 text-yellow-900 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="flex-1 p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{event.description}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.date), 'MMM d, yyyy')} at {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <User className="w-4 h-4" />
                          <span>{event.organizer}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                          {event.category}
                        </span>
                        <span className="text-white/40 text-xs">
                          Submitted {format(new Date(event.submittedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => handleApprove(event.id)}
                        disabled={processingId === event.id}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === event.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(event.id)}
                        disabled={processingId === event.id}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
