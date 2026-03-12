'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { DeleteSessionButton } from '@/components/admin/DeleteSessionButton'
import { formatDateTime } from '@/lib/utils'

type ActivityMode = 'P2P_FREE' | 'P2P_PAID'

interface AdminSession {
  id: string
  title: string
  categorySlug: string | null
  activityMode: ActivityMode
  status: string
  startTime: string | null
  city: string
  address: string | null
  price: number
  currency: string
  createdAt: string
  user: { name: string | null; email: string }
  userActivities: { id: string }[]
}

const MODE_STYLES: Record<ActivityMode, string> = {
  P2P_FREE: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  P2P_PAID: 'bg-amber-900/50 text-amber-400 border border-amber-800',
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Session Management</h1>
        <p className="text-neutral-500 mt-1">{sessions.length} P2P sessions total</p>
      </div>

      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Session</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Host</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Attendees</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-100">{session.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${MODE_STYLES[session.activityMode]}`}>
                          {session.activityMode === 'P2P_FREE' ? 'Free' : 'Paid'}
                        </span>
                        {session.categorySlug && (
                          <span className="text-xs text-neutral-500 capitalize">{session.categorySlug}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-neutral-300">{session.user.name || 'Anonymous'}</p>
                      <p className="text-xs text-neutral-500">{session.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {session.startTime ? formatDateTime(session.startTime) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {session.address || session.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {session.price === 0 ? 'Free' : `${session.currency} ${(session.price / 100).toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {session.userActivities.length}
                  </td>
                  <td className="px-6 py-4">
                    <DeleteSessionButton sessionId={session.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <div className="py-12 text-center text-neutral-500">No P2P sessions yet</div>
        )}
      </div>
    </div>
  )
}
