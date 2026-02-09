'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Download,
  Users,
  Mail,
  Calendar,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'

interface Attendee {
  id: string
  eventId: string
  eventName: string
  email: string
  name: string | null
  subscribe: boolean
  timestamp: string
  confirmed: boolean
}

interface NewsletterSubscriber {
  email: string
  name: string | null
  subscribedAt: string
  source: string
}

interface Stats {
  totalAttendees: number
  totalSubscribers: number
  eventsWithRsvps: number
  optInRate: number
}

export default function AdminAttendeesPage() {
  const { getToken, isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState<'attendees' | 'newsletter'>('attendees')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ totalAttendees: 0, totalSubscribers: 0, eventsWithRsvps: 0, optInRate: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }, [getToken])

  const fetchAttendees = useCallback(async (page = 1) => {
    try {
      const response = await fetch(`/api/attendance?page=${page}&limit=100`, { headers: await getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.attendees || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1)
          setCurrentPage(data.pagination.page || 1)
        }
      }
    } catch {
      toast.error('Failed to fetch attendees')
    }
  }, [getAuthHeaders])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', { headers: await getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalAttendees: data.stats?.totalAttendees || 0,
          totalSubscribers: data.stats?.totalSubscribers || 0,
          eventsWithRsvps: data.stats?.eventsWithRsvps || 0,
          optInRate: data.stats?.optInRate || 0,
        })
      }
    } catch {
      // Stats fetch failed, use local counts
    }
  }, [getAuthHeaders])

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers', { headers: await getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
      }
    } catch {
      // Newsletter endpoint might not exist yet, ignore
    }
  }, [getAuthHeaders])

  const fetchData = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    await Promise.all([fetchAttendees(1), fetchSubscribers(), fetchStats()])
    setLoading(false)
  }, [isLoaded, fetchAttendees, fetchSubscribers, fetchStats])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get unique events for filter
  const uniqueEvents = Array.from(new Set(attendees.map(a => a.eventName)))

  // Filter attendees
  const filteredAttendees = attendees.filter(a => {
    const matchesSearch =
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      a.eventName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEvent = selectedEvent === 'all' || a.eventName === selectedEvent
    return matchesSearch && matchesEvent
  })

  // Filter subscribers
  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Export to CSV
  const exportToCSV = (type: 'attendees' | 'newsletter') => {
    let csvContent = ''
    let filename = ''

    if (type === 'attendees') {
      csvContent = 'Email,Name,Event,Subscribed to Newsletter,Date\n'
      filteredAttendees.forEach(a => {
        csvContent += `"${a.email}","${a.name || ''}","${a.eventName}","${a.subscribe ? 'Yes' : 'No'}","${format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm')}"\n`
      })
      filename = `sweatbuddies-attendees-${format(new Date(), 'yyyy-MM-dd')}.csv`
    } else {
      csvContent = 'Email,Name,Subscribed Date,Source\n'
      filteredSubscribers.forEach(s => {
        csvContent += `"${s.email}","${s.name || ''}","${format(new Date(s.subscribedAt), 'yyyy-MM-dd HH:mm')}","${s.source}"\n`
      })
      filename = `sweatbuddies-newsletter-${format(new Date(), 'yyyy-MM-dd')}.csv`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    toast.success(`Exported ${type === 'attendees' ? filteredAttendees.length : filteredSubscribers.length} records`)
  }

  // Remove attendee
  const removeAttendee = async (attendeeId: string, attendeeName: string | null) => {
    if (!confirm(`Are you sure you want to remove ${attendeeName || 'this attendee'}? This will also remove their chat messages.`)) {
      return
    }

    setDeletingId(attendeeId)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/attendance?id=${attendeeId}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        setAttendees(prev => prev.filter(a => a.id !== attendeeId))
        toast.success('Attendee removed successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove attendee')
      }
    } catch {
      toast.error('Failed to remove attendee')
    } finally {
      setDeletingId(null)
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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Attendees & Subscribers</h1>
        <p className="text-neutral-500 mt-1 text-sm sm:text-base">View experience attendees and newsletter subscribers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalAttendees}</p>
              <p className="text-xs text-neutral-500">Total Attendees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalSubscribers}</p>
              <p className="text-xs text-neutral-500">Newsletter Subs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stats.eventsWithRsvps}</p>
              <p className="text-xs text-neutral-500">Events w/ RSVPs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stats.optInRate}%</p>
              <p className="text-xs text-neutral-500">Newsletter Opt-in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab('attendees')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-[0.98] ${
            activeTab === 'attendees'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Attendees ({stats.totalAttendees})
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-[0.98] ${
            activeTab === 'newsletter'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Newsletter ({stats.totalSubscribers})
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email, name, or experience..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
          />
        </div>

        {activeTab === 'attendees' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base appearance-none"
            >
              <option value="all">All Events</option>
              {uniqueEvents.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => exportToCSV(activeTab)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors active:scale-[0.98]"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Attendees Tab */}
      {activeTab === 'attendees' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No attendees found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Email</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Event</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Newsletter</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Date</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="p-4">
                          <a href={`mailto:${attendee.email}`} className="text-blue-600 hover:underline">
                            {attendee.email}
                          </a>
                        </td>
                        <td className="p-4 text-neutral-900">{attendee.name || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-sm">
                            {attendee.eventName}
                          </span>
                        </td>
                        <td className="p-4">
                          {attendee.subscribe ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-neutral-300" />
                          )}
                        </td>
                        <td className="p-4 text-neutral-500 text-sm">
                          {format(new Date(attendee.timestamp), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => removeAttendee(attendee.id, attendee.name)}
                            disabled={deletingId === attendee.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove attendee"
                          >
                            {deletingId === attendee.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-neutral-100">
                {filteredAttendees.map((attendee) => (
                  <div key={attendee.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <a href={`mailto:${attendee.email}`} className="text-blue-600 hover:underline text-sm break-all">
                          {attendee.email}
                        </a>
                        {attendee.name && (
                          <p className="text-neutral-900 font-medium mt-1">{attendee.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {attendee.subscribe ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-neutral-300" />
                        )}
                        <button
                          onClick={() => removeAttendee(attendee.id, attendee.name)}
                          disabled={deletingId === attendee.id}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove attendee"
                        >
                          {deletingId === attendee.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-xs">
                        {attendee.eventName}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        {format(new Date(attendee.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchAttendees(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchAttendees(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Newsletter Tab */}
      {activeTab === 'newsletter' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No subscribers found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Email</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Source</th>
                      <th className="text-left p-4 text-neutral-600 text-sm font-medium">Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber, index) => (
                      <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="p-4">
                          <a href={`mailto:${subscriber.email}`} className="text-blue-600 hover:underline">
                            {subscriber.email}
                          </a>
                        </td>
                        <td className="p-4 text-neutral-900">{subscriber.name || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-sm capitalize">
                            {subscriber.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-500 text-sm">
                          {format(new Date(subscriber.subscribedAt), 'MMM d, yyyy h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-neutral-100">
                {filteredSubscribers.map((subscriber, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <a href={`mailto:${subscriber.email}`} className="text-blue-600 hover:underline text-sm break-all">
                          {subscriber.email}
                        </a>
                        {subscriber.name && (
                          <p className="text-neutral-900 font-medium mt-1">{subscriber.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-xs capitalize">
                        {subscriber.source.replace('_', ' ')}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        {format(new Date(subscriber.subscribedAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
