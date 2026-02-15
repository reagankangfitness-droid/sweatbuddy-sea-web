'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Users, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react'

interface Attendee {
  id: string
  eventId: string
  eventName: string
  email: string
  name: string | null
  timestamp: string
  paymentStatus: string | null
  paymentMethod: string | null
  paymentAmount: number | null
  checkedInAt: string | null
  checkedInMethod: string | null
  actuallyAttended: boolean | null
  hostNotes: string | null
  taggedAs: string[]
  checkInCode: string | null
}

interface Stats {
  total: number
  checkedIn: number
  noShow: number
  attended: number
  paid: number
  free: number
  refunded: number
  waitlisted: number
}

interface GuestListManagerProps {
  eventId: string
}

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-purple-100 text-purple-700',
  'first-timer': 'bg-blue-100 text-blue-700',
  regular: 'bg-green-100 text-green-700',
  friend: 'bg-amber-100 text-amber-700',
}

export function GuestListManager({ eventId }: GuestListManagerProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [sort, setSort] = useState('timestamp')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [notesModal, setNotesModal] = useState<{ attendee: Attendee; notes: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        paymentStatus: paymentFilter,
        sort,
        page: String(page),
        limit: '50',
      })
      const res = await fetch(`/api/host/events/${eventId}/guests?${params}`)
      const data = await res.json()
      if (data.attendees) {
        setAttendees(data.attendees)
        setTotal(data.total)
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch guests:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, search, statusFilter, paymentFilter, sort, page])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === attendees.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(attendees.map(a => a.id)))
    }
  }

  const handleBulkAction = async (action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/host/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          attendeeIds: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        }),
      })
      const data = await res.json()

      if (action === 'export_csv' && data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `guests-${eventId}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        setSelectedIds(new Set())
        fetchGuests()
      }
    } catch (err) {
      console.error('Bulk action failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateAttendee = async (attendeeId: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/host/events/${eventId}/guests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, ...data }),
      })
      fetchGuests()
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const saveNotes = async () => {
    if (!notesModal) return
    await handleUpdateAttendee(notesModal.attendee.id, { hostNotes: notesModal.notes })
    setNotesModal(null)
  }

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case 'paid': return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Paid</span>
      case 'free': return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Free</span>
      case 'refunded': return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Refunded</span>
      case 'pending': return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
      default: return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Free</span>
    }
  }

  const getAttendanceBadge = (attended: boolean | null, checkedIn: string | null) => {
    if (checkedIn) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Checked In</span>
    if (attended === true) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Attended</span>
    if (attended === false) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">No-show</span>
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-400">Unmarked</span>
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-neutral-900">{stats.total}</div>
            <div className="text-xs text-neutral-500">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-xs text-neutral-500">Checked In</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-blue-600">{stats.attended}</div>
            <div className="text-xs text-neutral-500">Attended</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-red-500">{stats.noShow}</div>
            <div className="text-xs text-neutral-500">No-show</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-emerald-600">{stats.paid}</div>
            <div className="text-xs text-neutral-500">Paid</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-neutral-600">{stats.free}</div>
            <div className="text-xs text-neutral-500">Free</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-amber-600">{stats.refunded}</div>
            <div className="text-xs text-neutral-500">Refunded</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-purple-600">{stats.waitlisted}</div>
            <div className="text-xs text-neutral-500">Waitlisted</div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="checked-in">Checked In</option>
          <option value="attended">Attended</option>
          <option value="no-show">No-show</option>
        </select>
        <select
          value={paymentFilter}
          onChange={e => { setPaymentFilter(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="free">Free</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="timestamp">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="payment">Payment Status</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-sm font-medium text-amber-800">{selectedIds.size} selected</span>
          <button
            onClick={() => handleBulkAction('mark_attended')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Mark Attended
          </button>
          <button
            onClick={() => handleBulkAction('mark_no_show')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            Mark No-show
          </button>
          <button
            onClick={() => handleBulkAction('export_csv')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs font-medium bg-neutral-600 text-white rounded-md hover:bg-neutral-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-neutral-500 hover:text-neutral-700">
            Clear
          </button>
        </div>
      )}

      {/* Attendee Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 border-b text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <input
            type="checkbox"
            checked={selectedIds.size === attendees.length && attendees.length > 0}
            onChange={selectAll}
            className="rounded"
          />
          <div className="flex-1">Attendee</div>
          <div className="w-20 text-center hidden sm:block">Payment</div>
          <div className="w-24 text-center hidden sm:block">Status</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading...</div>
        ) : attendees.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No attendees found</p>
          </div>
        ) : (
          attendees.map(attendee => (
            <div key={attendee.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={selectedIds.has(attendee.id)}
                onChange={() => toggleSelect(attendee.id)}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-neutral-900 truncate">
                    {attendee.name || attendee.email.split('@')[0]}
                  </span>
                  {attendee.taggedAs?.map(tag => (
                    <span key={tag} className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}>
                      {tag}
                    </span>
                  ))}
                  {attendee.hostNotes && (
                    <MessageSquare className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <div className="text-xs text-neutral-500 truncate">{attendee.email}</div>
              </div>
              <div className="w-20 text-center hidden sm:block">
                {getPaymentBadge(attendee.paymentStatus)}
              </div>
              <div className="w-24 text-center hidden sm:block">
                {getAttendanceBadge(attendee.actuallyAttended, attendee.checkedInAt)}
              </div>
              <div className="w-20 flex items-center justify-center gap-1">
                <button
                  onClick={() => handleUpdateAttendee(attendee.id, { actuallyAttended: attendee.actuallyAttended !== true ? true : null })}
                  className={`p-1 rounded ${attendee.actuallyAttended === true ? 'text-green-600 bg-green-50' : 'text-neutral-400 hover:text-green-600'}`}
                  title="Mark attended"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleUpdateAttendee(attendee.id, { actuallyAttended: attendee.actuallyAttended !== false ? false : null })}
                  className={`p-1 rounded ${attendee.actuallyAttended === false ? 'text-red-600 bg-red-50' : 'text-neutral-400 hover:text-red-600'}`}
                  title="Mark no-show"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setNotesModal({ attendee, notes: attendee.hostNotes || '' })}
                  className="p-1 rounded text-neutral-400 hover:text-amber-600"
                  title="Add notes"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-500">
            Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 50 >= total}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export All button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleBulkAction('export_csv')}
          className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-neutral-50"
        >
          <Download className="w-4 h-4" /> Export All to CSV
        </button>
      </div>

      {/* Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setNotesModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">
                Notes for {notesModal.attendee.name || notesModal.attendee.email}
              </h3>
              <button onClick={() => setNotesModal(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={notesModal.notes}
              onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })}
              placeholder="Add private notes about this attendee..."
              className="w-full h-32 border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNotesModal(null)}
                className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
