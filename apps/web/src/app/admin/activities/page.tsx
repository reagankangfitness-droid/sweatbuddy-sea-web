'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import { Check, X, Clock, MapPin, Calendar, User, DollarSign, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

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
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
}

export default function AdminActivitiesPage() {
  const { isLoaded, userId } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING_APPROVAL' | 'PUBLISHED' | 'all'>('PENDING_APPROVAL')

  useEffect(() => {
    if (isLoaded && userId) {
      fetchActivities()
    }
  }, [isLoaded, userId, filter])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? '' : `?status=${filter}`
      const response = await fetch(`/api/admin/activities${statusParam}`)

      const data = await response.json()

      if (response.status === 403) {
        setError(`You do not have admin access. Your user ID: ${data.yourUserId || 'unknown'}`)
        return
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch activities')
      }

      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (activityId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(activityId)

      const response = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update activity')
      }

      const result = await response.json()

      toast.success(result.message)

      // Remove the activity from the list or update its status
      setActivities(prev => prev.filter(a => a.id !== activityId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update activity')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve submitted events before they go live
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'PENDING_APPROVAL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setFilter('PUBLISHED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'PUBLISHED'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Published
          </button>
        </div>

        {/* Activities List */}
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No events to review</h2>
            <p className="text-muted-foreground">
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
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
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
                      <div className="w-full h-full bg-muted flex items-center justify-center">
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
                        {/* Title and Status */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {activity.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            activity.status === 'PENDING_APPROVAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : activity.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Description */}
                        {activity.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {activity.description}
                          </p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {/* Date/Time */}
                          {activity.startTime && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(activity.startTime), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.city}</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {activity.price === 0 ? 'Free' : `${activity.currency} ${activity.price}`}
                            </span>
                          </div>

                          {/* Capacity */}
                          {activity.maxPeople && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>Max {activity.maxPeople} people</span>
                            </div>
                          )}
                        </div>

                        {/* Submitter Info */}
                        <div className="mt-4 pt-4 border-t border-border">
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
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {activity.user.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {activity.user.email} | Submitted {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {activity.status === 'PENDING_APPROVAL' && (
                        <div className="flex lg:flex-col gap-2">
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
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                          <a
                            href={`/activities/${activity.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Preview
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
