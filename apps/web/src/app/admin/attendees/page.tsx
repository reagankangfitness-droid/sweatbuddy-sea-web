'use client'

import { useState, useEffect } from 'react'
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

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

export default function AdminAttendeesPage() {
  const [activeTab, setActiveTab] = useState<'attendees' | 'newsletter'>('attendees')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchAttendees(), fetchSubscribers()])
    setLoading(false)
  }

  const fetchAttendees = async () => {
    try {
      const response = await fetch('/api/attendance', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.attendees || [])
      }
    } catch {
      toast.error('Failed to fetch attendees')
    }
  }

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
      }
    } catch {
      // Newsletter endpoint might not exist yet, ignore
    }
  }

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
      const response = await fetch(`/api/attendance?id=${attendeeId}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': ADMIN_SECRET },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Attendees & Subscribers</h1>
        <p className="text-white/50 mt-1 text-sm sm:text-base">View event attendees and newsletter subscribers</p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{attendees.length}</p>
                <p className="text-xs text-white/50">Total Attendees</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{subscribers.length}</p>
                <p className="text-xs text-white/50">Newsletter Subs</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{uniqueEvents.length}</p>
                <p className="text-xs text-white/50">Events w/ RSVPs</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round((attendees.filter(a => a.subscribe).length / attendees.length) * 100) || 0}%
                </p>
                <p className="text-xs text-white/50">Newsletter Opt-in</p>
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
                ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Attendees ({attendees.length})
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-[0.98] ${
              activeTab === 'newsletter'
                ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Newsletter ({subscribers.length})
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, name, or event..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8] text-base"
            />
          </div>

          {activeTab === 'attendees' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#38BDF8] text-base appearance-none"
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No attendees found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Email</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Name</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Event</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Newsletter</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Date</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendees.map((attendee) => (
                        <tr key={attendee.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <a href={`mailto:${attendee.email}`} className="text-[#38BDF8] hover:underline">
                              {attendee.email}
                            </a>
                          </td>
                          <td className="p-4 text-white">{attendee.name || '-'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-white/10 rounded text-white/80 text-sm">
                              {attendee.eventName}
                            </span>
                          </td>
                          <td className="p-4">
                            {attendee.subscribe ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-white/30" />
                            )}
                          </td>
                          <td className="p-4 text-white/60 text-sm">
                            {format(new Date(attendee.timestamp), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => removeAttendee(attendee.id, attendee.name)}
                              disabled={deletingId === attendee.id}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
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
                <div className="sm:hidden divide-y divide-white/10">
                  {filteredAttendees.map((attendee) => (
                    <div key={attendee.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <a href={`mailto:${attendee.email}`} className="text-[#38BDF8] hover:underline text-sm break-all">
                            {attendee.email}
                          </a>
                          {attendee.name && (
                            <p className="text-white font-medium mt-1">{attendee.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {attendee.subscribe ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-white/30" />
                          )}
                          <button
                            onClick={() => removeAttendee(attendee.id, attendee.name)}
                            disabled={deletingId === attendee.id}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
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
                        <span className="px-2 py-1 bg-white/10 rounded text-white/80 text-xs">
                          {attendee.eventName}
                        </span>
                        <span className="text-white/40 text-xs">
                          {format(new Date(attendee.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No subscribers found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Email</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Name</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Source</th>
                        <th className="text-left p-4 text-white/60 text-sm font-medium">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscribers.map((subscriber, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <a href={`mailto:${subscriber.email}`} className="text-[#38BDF8] hover:underline">
                              {subscriber.email}
                            </a>
                          </td>
                          <td className="p-4 text-white">{subscriber.name || '-'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-white/10 rounded text-white/80 text-sm capitalize">
                              {subscriber.source.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-white/60 text-sm">
                            {format(new Date(subscriber.subscribedAt), 'MMM d, yyyy h:mm a')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-white/10">
                  {filteredSubscribers.map((subscriber, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <a href={`mailto:${subscriber.email}`} className="text-[#38BDF8] hover:underline text-sm break-all">
                            {subscriber.email}
                          </a>
                          {subscriber.name && (
                            <p className="text-white font-medium mt-1">{subscriber.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-white/10 rounded text-white/80 text-xs capitalize">
                          {subscriber.source.replace('_', ' ')}
                        </span>
                        <span className="text-white/40 text-xs">
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
