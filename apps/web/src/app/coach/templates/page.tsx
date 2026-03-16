'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Clock, Users, DollarSign, Trash2, MapPin, ArrowLeft } from 'lucide-react'

interface SessionTemplate {
  id: string
  title: string
  description: string | null
  sessionType: string
  daysOfWeek: string[]
  startTime: string
  endTime: string | null
  price: number | null
  currency: string
  maxParticipants: number | null
  fitnessLevel: string | null
  locationName: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

const DAY_ABBREVS: Record<string, string> = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents == null || cents === 0) return 'Free'
  return `${currency} ${(cents / 100).toFixed(2)}`
}

export default function CoachTemplatesPage() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setError('')
      const res = await fetch('/api/coaches/templates')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load templates')
      }
      const data = await res.json()
      setTemplates(data.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template? Future sessions will no longer be auto-generated.')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/coaches/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete template')
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/host/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Session Templates</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Recurring schedules that auto-generate sessions
            </p>
          </div>
          <Link
            href="/coach/templates/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
          >
            Create template
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-900" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && templates.length === 0 && !error && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <p className="text-lg font-medium text-neutral-300">No templates yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Create a session template to automatically generate recurring sessions.
            </p>
            <Link
              href="/coach/templates/new"
              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
            >
              Create your first template
            </Link>
          </div>
        )}

        {/* Template list */}
        {!loading && templates.length > 0 && (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">{template.title}</h3>
                      <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        {template.sessionType.replace('_', ' ')}
                      </span>
                    </div>

                    {template.description && (
                      <p className="mt-1 text-sm text-neutral-400 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Schedule info */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {template.daysOfWeek.map((d) => DAY_ABBREVS[d] || d).join(', ')}{' '}
                        {template.startTime}
                        {template.endTime ? `\u2013${template.endTime}` : ''}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatPrice(template.price, template.currency)}
                      </span>

                      {template.maxParticipants && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Max {template.maxParticipants}
                        </span>
                      )}

                      {template.locationName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {template.locationName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/coach/templates/${template.id}/edit`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deleting === template.id}
                      className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
                      aria-label="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
