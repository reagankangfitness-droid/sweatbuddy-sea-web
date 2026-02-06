'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import { CommunitySkeleton } from '@/components/host/CommunitySkeleton'
import { Loader2, Users, Search, ChevronDown, ChevronUp, MessageSquare, Check, X } from 'lucide-react'

interface Attendee {
  email: string
  name: string | null
  eventsRSVPd: number
  eventsAttended: number
  lastEventDate: string | null
  lastEventName: string | null
  totalSpent: number
  notes: string | null
}

interface Stats {
  totalPeople: number
  totalAttended: number
  regulars: number
}

interface Event {
  id: string
  name: string
  date: string | null
}

function getLoyaltyBadge(count: number): { label: string; color: string; emoji: string } | null {
  if (count >= 20) return { label: 'Superfan', color: 'bg-purple-100 text-purple-700', emoji: '💎' }
  if (count >= 10) return { label: 'Loyal', color: 'bg-amber-100 text-amber-700', emoji: '🔥' }
  if (count >= 5) return { label: 'Regular', color: 'bg-blue-100 text-blue-700', emoji: '⭐' }
  if (count >= 3) return { label: 'Returning', color: 'bg-green-100 text-green-700', emoji: '🔄' }
  return null
}

export default function CommunityPage() {
  const router = useRouter()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [communityLink, setCommunityLink] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'attended'>('all')
  const [sort, setSort] = useState<'lastSeen' | 'events' | 'name'>('lastSeen')

  // Expanded row for notes
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Quick message modal
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageAudience, setMessageAudience] = useState<'all' | 'regulars'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Fetch community data
        const params = new URLSearchParams({
          filter,
          sort,
          search,
        })
        const res = await fetch(`/api/host/community?${params}`)
        if (!res.ok) throw new Error('Failed to load community data')

        const data = await res.json()
        setAttendees(data.attendees || [])
        setStats(data.stats || null)
        setEvents(data.events || [])
        setCommunityLink(data.communityLink || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, filter, sort, search])

  const handleExpandRow = (email: string, currentNotes: string | null) => {
    if (expandedEmail === email) {
      setExpandedEmail(null)
    } else {
      setExpandedEmail(email)
      setEditingNotes(currentNotes || '')
    }
  }

  const handleSaveNotes = async (email: string) => {
    setSavingNotes(true)
    try {
      const res = await fetch('/api/host/community/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notes: editingNotes }),
      })

      if (!res.ok) throw new Error('Failed to save notes')

      // Update local state
      setAttendees(prev => prev.map(a => {
        if (a.email.toLowerCase() === email.toLowerCase()) {
          return { ...a, notes: editingNotes || null }
        }
        return a
      }))

      setExpandedEmail(null)
    } catch {
      alert('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const generateMessage = () => {
    if (!communityLink) {
      return 'Hey! Join our community group for updates on upcoming events!'
    }
    return `Hey! Join our community group for updates on upcoming events: ${communityLink}`
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(generateMessage())
    alert('Message copied to clipboard!')
    setShowMessageModal(false)
  }

  if (isLoading) {
    return <CommunitySkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-red-600">{error}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Your Community</h1>
            <p className="text-neutral-500">Everyone who&apos;s joined your events</p>
          </div>
          <button
            onClick={() => setShowMessageModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Quick Message
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-neutral-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-neutral-900">{stats.totalPeople}</p>
              <p className="text-sm text-neutral-500">Total People</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalAttended}</p>
              <p className="text-sm text-neutral-500">Showed Up</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.regulars}</p>
              <p className="text-sm text-neutral-500">Regulars (3+)</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All RSVPs
            </button>
            <button
              onClick={() => setFilter('attended')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                filter === 'attended'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Attended Only
            </button>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'lastSeen' | 'events' | 'name')}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="lastSeen">Last Seen</option>
            <option value="events">Most Events</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Attendee List */}
        {attendees.length === 0 ? (
          <div className="p-12 bg-neutral-50 rounded-xl text-center">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="font-medium text-neutral-900 mb-1">No attendees yet</p>
            <p className="text-sm text-neutral-500">When people RSVP to your events, they&apos;ll show up here</p>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            {attendees.map((attendee) => (
              <div key={attendee.email} className="border-b border-neutral-100 last:border-0">
                {/* Main Row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => handleExpandRow(attendee.email, attendee.notes)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-neutral-600">
                        {(attendee.name?.[0] || attendee.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-neutral-900 truncate">
                          {attendee.name || 'Anonymous'}
                        </p>
                        {(() => {
                          const badge = getLoyaltyBadge(attendee.eventsRSVPd)
                          if (!badge) return null
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                              {badge.emoji} {badge.label}
                            </span>
                          )
                        })()}
                        {attendee.notes && (
                          <span className="text-neutral-400" title="Has notes">
                            📝
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">{attendee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-neutral-900">
                        {attendee.eventsRSVPd} event{attendee.eventsRSVPd !== 1 ? 's' : ''}
                        {attendee.eventsAttended > 0 && (
                          <span className="text-green-600 ml-1">
                            ({attendee.eventsAttended} attended)
                          </span>
                        )}
                      </p>
                      {attendee.lastEventDate && (
                        <p className="text-xs text-neutral-400">
                          Last: {new Date(attendee.lastEventDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {expandedEmail === attendee.email ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Notes Section */}
                {expandedEmail === attendee.email && (
                  <div className="px-4 pb-4 bg-neutral-50">
                    <div className="ml-13">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Notes about {attendee.name || 'this person'}
                      </label>
                      <textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="Add notes... (e.g., prefers morning sessions, vegetarian)"
                        className="w-full p-3 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-neutral-400">
                          {attendee.totalSpent > 0 && `Total spent: $${(attendee.totalSpent / 100).toFixed(2)}`}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedEmail(null)}
                            className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(attendee.email)}
                            disabled={savingNotes}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 disabled:opacity-50"
                          >
                            {savingNotes ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Quick Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Quick Message</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
              Generate a message to share with your community. Copy and paste into WhatsApp, Telegram, or any messaging app.
            </p>

            {/* Audience Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Audience
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={messageAudience === 'all'}
                    onChange={() => setMessageAudience('all')}
                    className="text-neutral-900"
                  />
                  <span className="text-sm">All RSVPs ({stats?.totalPeople || 0} people)</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="audience"
                    value="regulars"
                    checked={messageAudience === 'regulars'}
                    onChange={() => setMessageAudience('regulars')}
                    className="text-neutral-900"
                  />
                  <span className="text-sm">Regulars only ({stats?.regulars || 0} people with 3+ events)</span>
                </label>
              </div>
            </div>

            {/* Message Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Preview
              </label>
              <div className="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700">
                {generateMessage()}
              </div>
              {!communityLink && (
                <p className="text-xs text-amber-600 mt-2">
                  Tip: Add a community link to your events for a better message!
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={copyMessage}
                className="flex-1 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700"
              >
                Copy Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
