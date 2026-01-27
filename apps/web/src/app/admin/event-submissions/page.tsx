'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Check, X, Clock, MapPin, Calendar, Mail, Instagram, User, ExternalLink, Copy, ImageIcon } from 'lucide-react'
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

// Simple password protection
const ADMIN_SECRET = 'sweatbuddies-admin-2024'

export default function AdminEventSubmissionsPage() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING')
  const [isAuthed, setIsAuthed] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Check if already authenticated
    const storedAuth = localStorage.getItem('admin-auth')
    if (storedAuth === ADMIN_SECRET) {
      setIsAuthed(true)
    }
  }, [])

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? 'all' : filter
      const response = await fetch(`/api/admin/event-submissions?status=${statusParam}`, {
        headers: {
          'x-admin-secret': ADMIN_SECRET,
        },
      })

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
    if (isAuthed) {
      fetchSubmissions()
    }
  }, [isAuthed, filter, fetchSubmissions])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_SECRET) {
      localStorage.setItem('admin-auth', password)
      setIsAuthed(true)
    } else {
      toast.error('Incorrect password')
    }
  }

  const handleAction = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(submissionId)

      const response = await fetch(`/api/admin/event-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
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

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/20 max-w-sm w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg mb-4 text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8] text-base"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38BDF8]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Event Submissions</h1>
          <p className="text-white/60 mt-2">
            Review and approve submitted events
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
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No submissions</h2>
            <p className="text-white/60">
              {filter === 'PENDING'
                ? 'No pending event submissions to review.'
                : `No ${filter.toLowerCase()} submissions.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
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
                        <h3 className="text-xl font-semibold text-white">
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
                        <p className="text-white/60 mb-4">{submission.description}</p>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-4 h-4" />
                          <span>{submission.day} • {submission.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="w-4 h-4" />
                          <span>{submission.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <span className={`px-2 py-0.5 rounded text-xs ${submission.recurring ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
                            {submission.recurring ? 'Recurring' : 'One-time'}
                          </span>
                        </div>
                      </div>

                      {/* Organizer Info */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-white/60">
                            <User className="w-4 h-4" />
                            <span>{submission.organizerName}</span>
                          </div>
                          <a
                            href={`https://instagram.com/${submission.organizerInstagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#38BDF8] hover:underline"
                          >
                            <Instagram className="w-4 h-4" />
                            @{submission.organizerInstagram}
                          </a>
                          <a
                            href={`mailto:${submission.contactEmail}`}
                            className="flex items-center gap-1 text-white/60 hover:text-[#38BDF8]"
                          >
                            <Mail className="w-4 h-4" />
                            {submission.contactEmail}
                          </a>
                        </div>
                        <p className="text-xs text-white/40 mt-2">
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
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => copyJsonSnippet(submission)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
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
    </div>
  )
}
