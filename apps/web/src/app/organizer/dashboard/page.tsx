'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  MessageCircle,
  LogOut,
  Loader2,
  ChevronRight,
  Instagram,
  MapPin
} from 'lucide-react'

interface OrganizerEvent {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null
  time: string
  location: string
  imageUrl?: string | null
  recurring: boolean
  attendeeCount: number
  source: 'static' | 'submission'
  status?: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
}

interface Organizer {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

export default function OrganizerDashboardPage() {
  const router = useRouter()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }
        const sessionData = await sessionRes.json()
        setOrganizer(sessionData.organizer)

        // Get events
        const eventsRes = await fetch('/api/organizer/events')
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/organizer/verify', { method: 'DELETE' })
    router.push('/organizer')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#3477f8]" />
      </div>
    )
  }

  if (!organizer) {
    return null
  }

  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-heading font-bold text-xl text-[#3477f8]">
              SweatBuddies
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600">Organizer Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                @{organizer.instagramHandle}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Welcome back{organizer.name ? `, ${organizer.name}` : ''}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s an overview of your events and attendees
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#3477f8]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#3477f8]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{events.length}</span>
            </div>
            <p className="text-sm text-gray-600">Active Events</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{totalAttendees}</span>
            </div>
            <p className="text-sm text-gray-600">Total Attendees</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Direct</span>
            </div>
            <p className="text-sm text-gray-600">1:1 Chat Available</p>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Your Events
          </h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 mb-4">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-sm text-gray-600 mb-4">
                Events matching your Instagram handle (@{organizer.instagramHandle}) will appear here.
              </p>
              <Link
                href="/submit"
                className="inline-block px-4 py-2 bg-[#3477f8] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition"
              >
                Submit an Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/organizer/dashboard/${event.id}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:border-[#3477f8]/30 hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex items-center p-4 gap-4">
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <div
                        className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${event.imageUrl})` }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {event.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {event.category}
                        </span>
                        {event.status === 'pending' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                            Pending Review
                          </span>
                        )}
                        {event.status === 'approved' && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live
                          </span>
                        )}
                        {event.status === 'rejected' && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                            Rejected
                          </span>
                        )}
                        <span>{event.day} {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Attendee Count */}
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-[#3477f8]">
                          <Users className="w-4 h-4" />
                          <span className="font-bold">{event.attendeeCount}</span>
                        </div>
                        <span className="text-xs text-gray-500">going</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
