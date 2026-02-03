'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Image from 'next/image'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Clock,
  Check,
  X,
  Calendar,
  MapPin,
  User,
  Inbox,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface PendingEvent {
  id: string
  eventName: string
  organizerName: string
  organizerEmail: string
  organizerInstagram: string
  eventDate: string | null
  time: string
  location: string
  description: string
  category: string
  createdAt: string
  imageUrl?: string
}

export default function PendingEventsPage() {
  const { getToken, isLoaded } = useAuth()
  const [events, setEvents] = useState<PendingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }, [getToken])

  const fetchPendingEvents = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/event-submissions?status=PENDING', {
        headers: await getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.submissions || [])
      } else if (res.status === 401) {
        toast.error('Unauthorized - please sign in with an admin account')
      } else {
        toast.error(`Failed to load pending events: ${res.status}`)
      }
    } catch {
      toast.error('Failed to load pending events')
    } finally {
      setLoading(false)
    }
  }, [isLoaded, getAuthHeaders])

  useEffect(() => {
    fetchPendingEvents()
  }, [fetchPendingEvents])

  const handleApprove = async (eventId: string) => {
    setProcessingId(eventId)
    try {
      const res = await fetch(`/api/admin/event-submissions/${eventId}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status: 'APPROVED' })
      })

      if (res.ok) {
        setEvents(events.filter(e => e.id !== eventId))
        toast.success('Event approved and published!')
      } else {
        toast.error('Failed to approve event')
      }
    } catch (error) {
      toast.error('Failed to approve event')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (eventId: string) => {
    setProcessingId(eventId)
    try {
      const res = await fetch(`/api/admin/event-submissions/${eventId}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status: 'REJECTED' })
      })

      if (res.ok) {
        setEvents(events.filter(e => e.id !== eventId))
        toast.success('Event rejected')
      } else {
        toast.error('Failed to reject event')
      }
    } catch (error) {
      toast.error('Failed to reject event')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Pending Events</h1>
          <p className="text-neutral-500 mt-1">Review and approve submitted events</p>
        </div>
        <button
          onClick={fetchPendingEvents}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{events.length}</p>
              <p className="text-xs text-neutral-500">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Events List */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
          <Inbox className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">All caught up!</h3>
          <p className="text-neutral-500">No pending events to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="lg:w-48 h-32 lg:h-auto relative flex-shrink-0">
                    <Image
                      src={event.imageUrl}
                      alt={event.eventName}
                      className="w-full h-full object-cover"
                      fill
                      unoptimized
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="flex-1 p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{event.eventName}</h3>
                      <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{event.description}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        {event.eventDate && (
                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(event.eventDate), 'MMM d, yyyy')} at {event.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <User className="w-4 h-4" />
                          <span>{event.organizerName || event.organizerInstagram}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full">
                          {event.category}
                        </span>
                        <span className="text-neutral-400 text-xs">
                          Submitted {format(new Date(event.createdAt), 'MMM d, h:mm a')}
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
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
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
