'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Check, X, Clock, MapPin, Calendar, Mail, Instagram, User, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface EventSubmission {
  id: string
  eventName: string
  category: string
  day: string
  time: string
  recurring: boolean
  location: string
  description: string | null
  imageUrl: string | null
  organizerName: string
  organizerInstagram: string
  contactEmail: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedAt: string | null
}

export default function AdminEventSubmissionsPage() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING')

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? 'all' : filter
      const response = await fetch(`/api/admin/event-submissions?status=${statusParam}`)

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchSubmissions()
  }, [filter, fetchSubmissions])

  const handleAction = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(submissionId)

      const response = await fetch(`/api/admin/event-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update submission')
      }

      const result = await response.json()
      toast.success(result.message)

      // Remove from list or update status
      if (filter !== 'all') {
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
      } else {
        setSubmissions(prev =>
          prev.map(s =>
            s.id === submissionId
              ? { ...s, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
              : s
          )
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update submission')
    } finally {
      setProcessingId(null)
    }
  }

  const copyJsonSnippet = (submission: EventSubmission) => {
    const snippet = `{
  "id": "${Date.now()}",
  "name": "${submission.eventName}",
  "category": "${submission.category}",
  "day": "${submission.day}",
  "time": "${submission.time}",
  "location": "${submission.location}",
  "description": "${submission.description || ''}",
  "organizer": "${submission.organizerInstagram}",
  "imageUrl": "${submission.imageUrl || ''}",
  "recurring": ${submission.recurring}
}`
    navigator.clipboard.writeText(snippet)
    toast.success('JSON copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-neutral-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Experience Submissions</h1>
        <p className="text-neutral-500 mt-1">
          Review and approve submitted experiences
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No submissions</h2>
          <p className="text-neutral-500">
            {filter === 'PENDING'
              ? 'No pending experience submissions to review.'
              : `No ${filter.toLowerCase()} submissions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
            >
                {/* Event Image */}
                {submission.imageUrl && (
                  <div className="relative h-48 w-full bg-white/5">
                    <Image
                      src={submission.imageUrl}
                      alt={submission.eventName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-neutral-900">
                          {submission.eventName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            submission.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : submission.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {submission.category}
                        </span>
                      </div>

                      {/* Description */}
                      {submission.description && (
                        <p className="text-neutral-600 mb-4">{submission.description}</p>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="w-4 h-4" />
                          <span>{submission.day} • {submission.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <MapPin className="w-4 h-4" />
                          <span>{submission.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <span className={`px-2 py-0.5 rounded text-xs ${submission.recurring ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {submission.recurring ? 'Recurring' : 'One-time'}
                          </span>
                        </div>
                      </div>

                      {/* Organizer Info */}
                      <div className="pt-4 border-t border-neutral-200">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <User className="w-4 h-4" />
                            <span>{submission.organizerName}</span>
                          </div>
                          <a
                            href={`https://instagram.com/${submission.organizerInstagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Instagram className="w-4 h-4" />
                            @{submission.organizerInstagram}
                          </a>
                          <a
                            href={`mailto:${submission.contactEmail}`}
                            className="flex items-center gap-1 text-neutral-600 hover:text-blue-600"
                          >
                            <Mail className="w-4 h-4" />
                            {submission.contactEmail}
                          </a>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">
                          Submitted {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      {submission.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(submission.id, 'approve')}
                            disabled={processingId === submission.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(submission.id, 'reject')}
                            disabled={processingId === submission.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => copyJsonSnippet(submission)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </button>
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
