'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Pause, Play, Trash2, Calendar, Clock, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

interface SessionTemplate {
  id: string
  title: string
  description: string | null
  categorySlug: string | null
  daysOfWeek: string[]
  startTime: string
  endTime: string | null
  endDate: string | null
  price: number | null
  currency: string
  maxParticipants: number | null
  isActive: boolean
  createdAt: string
  _count: { sessions: number }
}

export default function HostTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/host/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/host/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, isActive: !isActive } : t))
        toast.success(isActive ? 'Template paused' : 'Template resumed')
      }
    } catch {
      toast.error('Failed to update template')
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this recurring session? Future sessions with no RSVPs will be cancelled.')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/host/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        toast.success(`Deleted. ${data.cancelledSessions} future sessions cancelled.`)
      }
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setActionLoading(null)
    }
  }

  function formatPrice(price: number | null, currency: string) {
    if (!price) return 'Free'
    return `${currency} ${(price / 100).toFixed(0)}`
  }

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Go back" className="p-1 -ml-1 rounded-lg hover:bg-[#FFFBF8]">
              <ArrowLeft className="w-5 h-5 text-[#4A4A5A]" />
            </button>
            <h1 className="text-base font-semibold text-[#1A1A1A]">Recurring Sessions</h1>
          </div>
          <button
            onClick={() => router.push('/buddy/host/new')}
            className="flex items-center gap-1.5 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-[#D4D4D4] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">No recurring sessions yet</h2>
            <p className="text-sm text-[#71717A] mb-6 max-w-xs mx-auto">
              Create a recurring session to automatically generate weekly sessions.
            </p>
            <button
              onClick={() => router.push('/buddy/host/new')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white"
            >
              <Plus className="w-4 h-4" />
              Create recurring session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`rounded-2xl border p-5 transition-all ${
                  template.isActive
                    ? 'border-black/[0.06] bg-white'
                    : 'border-black/[0.04] bg-neutral-50 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-[#1A1A1A] truncate">{template.title}</h3>
                      {!template.isActive && (
                        <span className="shrink-0 text-xs font-medium text-[#71717A] bg-neutral-100 px-2 py-0.5 rounded-full">Paused</span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-[#71717A] line-clamp-1">{template.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 ml-3 text-sm font-semibold ${template.price ? 'text-[#1A1A1A]' : 'text-green-600'}`}>
                    {formatPrice(template.price, template.currency)}
                  </span>
                </div>

                {/* Schedule */}
                <div className="flex flex-wrap gap-3 text-xs text-[#71717A] mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{template.daysOfWeek.map((d) => DAY_LABELS[d] || d).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{template.startTime}{template.endTime ? ` – ${template.endTime}` : ''}</span>
                  </div>
                  {template.maxParticipants && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Max {template.maxParticipants}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[#71717A]">
                    <span>{template._count.sessions} sessions generated</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(template.id, template.isActive)}
                    disabled={actionLoading === template.id}
                    className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] px-3 py-2 text-xs font-medium text-[#4A4A5A] hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === template.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : template.isActive ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {template.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    disabled={actionLoading === template.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
