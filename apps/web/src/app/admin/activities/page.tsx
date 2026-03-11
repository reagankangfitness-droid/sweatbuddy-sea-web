'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Check, X, Clock, MapPin, Calendar, User, DollarSign, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type ActivityMode = 'MARKETPLACE' | 'P2P_FREE' | 'P2P_PAID'

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  categorySlug: string | null
  city: string
  address: string | null
  latitude: number
  longitude: number
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  imageUrl: string | null
  price: number
  currency: string
  status: string
  activityMode: ActivityMode
  deletedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
}

const MODE_LABELS: Record<ActivityMode, string> = {
  MARKETPLACE: 'Marketplace',
  P2P_FREE: 'P2P Free',
  P2P_PAID: 'P2P Paid',
}

const MODE_STYLES: Record<ActivityMode, string> = {
  MARKETPLACE: 'bg-neutral-800 text-neutral-300',
  P2P_FREE: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  P2P_PAID: 'bg-amber-900/50 text-amber-400 border border-amber-800',
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING_APPROVAL' | 'PUBLISHED' | 'all'>('PENDING_APPROVAL')
  const [modeFilter, setModeFilter] = useState<ActivityMode | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (modeFilter !== 'all') params.set('activityMode', modeFilter)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/admin/activities${qs}`)

      const data = await response.json()

      if (response.status === 403) {
        setError(`You do not have admin access. Your user ID: ${data.yourUserId || 'unknown'}`)
        return
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch activities')
      }

      setActivities(data.activities || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filter, modeFilter])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleAction = async (activityId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(activityId)

      const response = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error('Failed to update activity')

      const result = await response.json()
      toast.success(result.message)
      setActivities(prev => prev.filter(a => a.id !== activityId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update activity')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} session(s)? This cannot be undone.`)) return
    await Promise.all(
      selectedIds.map(id => fetch(`/api/admin/activities/${id}`, { method: 'DELETE' }))
    )
    setSelectedIds([])
    fetchActivities()
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm('Permanently delete this session? This cannot be undone.')) return
    try {
      setProcessingId(activityId)
      const response = await fetch(`/api/admin/activities/${activityId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete session')
      toast.success('Session deleted')
      setActivities(prev => prev.filter(a => a.id !== activityId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-neutral-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100">Event Approval Queue</h1>
        <p className="text-neutral-500 mt-1">
          Review and approve submitted events before they go live
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      <div className="flex gap-2 mb-3 min-w-max sm:min-w-0">
        {(['PENDING_APPROVAL', 'PUBLISHED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === s
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:bg-neutral-900'
            }`}
          >
            {s === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Published'}
          </button>
        ))}
      </div>
      </div>

      {/* Activity Mode Filter */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      <div className="flex gap-2 mb-6 min-w-max sm:min-w-0">
        {(['all', 'MARKETPLACE', 'P2P_FREE', 'P2P_PAID'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModeFilter(m)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              modeFilter === m
                ? 'bg-neutral-200 text-neutral-900'
                : 'bg-neutral-950 text-neutral-500 border border-neutral-800 hover:bg-neutral-900'
            }`}
          >
            {m === 'all' ? 'All Modes' : MODE_LABELS[m]}
          </button>
        ))}
      </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-300">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-800 shadow-sm">
          <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">No events to review</h2>
          <p className="text-neutral-500">
            {filter === 'PENDING_APPROVAL'
              ? 'All submitted events have been reviewed.'
              : 'No published events yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm"
            >
                <div className="flex flex-col lg:flex-row">
                  {/* Checkbox */}
                  <div className="flex items-start pt-4 pl-4 lg:pt-6 lg:pl-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(activity.id)}
                      onChange={() => toggleSelect(activity.id)}
                      className="w-4 h-4 mt-1 accent-white cursor-pointer"
                    /></div>
                  {/* Image */}
                  <div className="lg:w-64 h-48 lg:h-auto relative flex-shrink-0">
                    {activity.imageUrl ? (
                      <Image
                        src={activity.imageUrl}
                        alt={activity.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                        <span className="text-4xl">
                          {activity.type === 'RUN' ? '🏃' :
                           activity.type === 'GYM' ? '💪' :
                           activity.type === 'YOGA' ? '🧘' :
                           activity.type === 'HIKE' ? '🥾' :
                           activity.type === 'CYCLING' ? '🚴' : '✨'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        {/* Title, Mode Badge and Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className={`text-xl font-semibold ${activity.deletedAt ? 'text-neutral-500 line-through' : 'text-neutral-100'}`}>
                            {activity.title}
                          </h3>
                          {activity.deletedAt && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-900/50 text-red-400 border border-red-700 uppercase tracking-wide">
                              Deleted
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${MODE_STYLES[activity.activityMode] ?? 'bg-neutral-800 text-neutral-300'}`}>
                            {MODE_LABELS[activity.activityMode] ?? activity.activityMode}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            activity.status === 'PENDING_APPROVAL'
                              ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                              : activity.status === 'PUBLISHED'
                              ? 'bg-green-900/50 text-green-400 border border-green-800'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Description */}
                        {activity.description && (
                          <p className="text-neutral-400 mb-4 line-clamp-2">
                            {activity.description}
                          </p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {/* Date/Time */}
                          {activity.startTime && (
                            <div className="flex items-center gap-2 text-neutral-400">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(activity.startTime), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-2 text-neutral-400">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.city}</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 text-neutral-400">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {activity.price === 0 ? 'Free' : `${activity.currency} ${(activity.price / 100).toFixed(2)}`}
                            </span>
                          </div>

                          {/* Capacity */}
                          {activity.maxPeople && (
                            <div className="flex items-center gap-2 text-neutral-400">
                              <User className="w-4 h-4" />
                              <span>Max {activity.maxPeople} people</span>
                            </div>
                          )}
                        </div>

                        {/* Submitter Info */}
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                          <div className="flex items-center gap-3">
                            {activity.user.imageUrl ? (
                              <Image
                                src={activity.user.imageUrl}
                                alt={activity.user.name || 'User'}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-neutral-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-neutral-100">
                                {activity.user.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {activity.user.email} | Submitted {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap lg:flex-col gap-2">
                        {activity.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleAction(activity.id, 'approve')}
                              disabled={processingId === activity.id}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(activity.id, 'reject')}
                              disabled={processingId === activity.id}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-900 text-red-400 border border-red-800 rounded-lg font-medium hover:bg-red-900/60 transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        <a
                          href={`/activities/${activity.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg font-medium hover:bg-neutral-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Preview
                        </a>
                        {(activity.activityMode === 'P2P_FREE' || activity.activityMode === 'P2P_PAID') && (
                          <button
                            onClick={() => handleDelete(activity.id)}
                            disabled={processingId === activity.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-950 text-red-500 border border-red-900 rounded-lg font-medium hover:bg-red-950 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
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
