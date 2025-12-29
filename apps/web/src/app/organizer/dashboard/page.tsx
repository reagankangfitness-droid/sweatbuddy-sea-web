'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  LogOut,
  Loader2,
  ChevronRight,
  Instagram,
  MapPin,
  Plus,
  Copy,
  Edit,
  ExternalLink,
  Check,
} from 'lucide-react'
import { Logo } from '@/components/logo'

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
  isFree?: boolean
  price?: number | null
  maxTickets?: number | null
  ticketsSold?: number | null
}

interface RecentActivity {
  id: string
  eventId: string
  eventName: string
  attendeeName: string
  timestamp: string
  isPaid: boolean
  amount: number
}

interface Organizer {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

type TabFilter = 'all' | 'live' | 'pending' | 'rejected'

export default function OrganizerDashboardPage() {
  const router = useRouter()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [stats, setStats] = useState({ weeklySignups: 0, totalEarnings: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)

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
          setStats(eventsData.stats || { weeklySignups: 0, totalEarnings: 0 })
          setRecentActivity(eventsData.recentActivity || [])
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

  const copyEventLink = async (eventId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/e/${eventId}`
    await navigator.clipboard.writeText(url)
    setCopiedEventId(eventId)
    setTimeout(() => setCopiedEventId(null), 2000)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    )
  }

  if (!organizer) {
    return null
  }

  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0)
  const liveEvents = events.filter((e) => e.status === 'approved')
  const pendingEvents = events.filter((e) => e.status === 'pending')
  const rejectedEvents = events.filter((e) => e.status === 'rejected')

  const filteredEvents = activeTab === 'all'
    ? events
    : activeTab === 'live'
      ? liveEvents
      : activeTab === 'pending'
        ? pendingEvents
        : rejectedEvents

  const tabCounts = {
    all: events.length,
    live: liveEvents.length,
    pending: pendingEvents.length,
    rejected: rejectedEvents.length,
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-sans font-semibold text-lg text-neutral-900">SweatBuddies</span>
            </Link>
            <span className="text-neutral-300">|</span>
            <span className="text-body-small text-neutral-600">Organizer Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-neutral-500" />
              <span className="text-ui text-neutral-700">
                @{organizer.instagramHandle}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/10 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-sans text-display-section text-neutral-900 mb-1">
              Welcome back{organizer.name ? `, ${organizer.name}` : ''}!
            </h1>
            <p className="text-body-default text-neutral-600">
              Here&apos;s an overview of your events and attendees
            </p>
          </div>
          <Link
            href="/#submit-desktop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-semibold hover:bg-neutral-700 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-neutral-900">{liveEvents.length}</span>
            </div>
            <p className="text-body-small text-neutral-600">Live Events</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-neutral-900">{totalAttendees}</span>
            </div>
            <p className="text-body-small text-neutral-600">Total Attendees</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-neutral-900">+{stats.weeklySignups}</span>
            </div>
            <p className="text-body-small text-neutral-600">This Week</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-neutral-900">
                ${(stats.totalEarnings / 100).toFixed(0)}
              </span>
            </div>
            <p className="text-body-small text-neutral-600">Earnings</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events List - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-display-card text-neutral-900">
                Your Events
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['all', 'live', 'pending', 'rejected'] as TabFilter[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-neutral-900/10 border border-neutral-900/20 rounded-2xl text-neutral-900 mb-4">
                {error}
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-100 shadow-card">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="font-sans text-display-card text-neutral-900 mb-2">
                  {activeTab === 'all' ? 'No events found' : `No ${activeTab} events`}
                </h3>
                <p className="text-body-small text-neutral-600 mb-4">
                  {activeTab === 'all'
                    ? `Events matching your Instagram handle (@${organizer.instagramHandle}) will appear here.`
                    : `You don't have any ${activeTab} events at the moment.`}
                </p>
                {activeTab === 'all' && (
                  <Link
                    href="/#submit-desktop"
                    className="inline-block px-6 py-3 bg-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 transition shadow-md text-white"
                  >
                    Submit an Event
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-card-hover transition overflow-hidden"
                  >
                    <Link
                      href={`/organizer/dashboard/${event.id}`}
                      className="flex items-center p-4 gap-4"
                    >
                      {/* Event Image */}
                      {event.imageUrl ? (
                        <div
                          className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${event.imageUrl})` }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-neutral-400" />
                        </div>
                      )}

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-semibold text-neutral-900 truncate">
                          {event.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-body-small text-neutral-600">
                          <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                            {event.category}
                          </span>
                          {event.status === 'pending' && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                              Pending
                            </span>
                          )}
                          {event.status === 'approved' && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                          {event.status === 'rejected' && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                              Rejected
                            </span>
                          )}
                          {!event.isFree && event.price && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                              ${(event.price / 100).toFixed(0)}
                            </span>
                          )}
                          <span className="text-neutral-500">{event.day} {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>

                      {/* Attendee Count & Capacity */}
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-neutral-900">
                            <Users className="w-4 h-4" />
                            <span className="font-bold">
                              {event.attendeeCount}
                              {event.maxTickets && (
                                <span className="text-neutral-400 font-normal">/{event.maxTickets}</span>
                              )}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">going</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                      </div>
                    </Link>

                    {/* Quick Actions */}
                    {event.status === 'approved' && (
                      <div className="flex items-center gap-2 px-4 pb-3 pt-0 border-t border-neutral-50">
                        <button
                          onClick={(e) => copyEventLink(event.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Share Link
                            </>
                          )}
                        </button>
                        <Link
                          href={`/organizer/dashboard/${event.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <a
                          href={`/e/${event.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity - Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <h2 className="font-sans text-display-card text-neutral-900 mb-4">
              Recent Activity
            </h2>

            {recentActivity.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-neutral-100 shadow-card">
                <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-body-small text-neutral-500">
                  New signups will appear here
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-neutral-50 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {activity.attendeeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900">
                            <span className="font-medium">{activity.attendeeName}</span>
                            {' '}
                            {activity.isPaid ? 'purchased a ticket' : 'joined'}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {activity.eventName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-400">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                            {activity.isPaid && activity.amount > 0 && (
                              <span className="text-xs font-medium text-green-600">
                                +${(activity.amount / 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
