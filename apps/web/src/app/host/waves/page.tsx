'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Clock, Users, MessageCircle, Trash2, X } from 'lucide-react'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'

interface Wave {
  id: string
  activityType: string
  area: string
  locationName: string | null
  thought: string | null
  participantCount: number
  waveThreshold: number
  isUnlocked: boolean
  chatId: string | null
  startedAt: string
  expiresAt: string
  scheduledFor: string | null
}

const ACTIVITY_GROUPS = [
  { label: 'Cardio', types: ['RUN', 'WALK', 'CYCLE', 'SWIM', 'HIKE', 'ROWING', 'SURFING', 'SPINNING'] },
  { label: 'Strength', types: ['GYM', 'CROSSFIT', 'HYROX', 'STRETCHING', 'PILATES'] },
  { label: 'Racquet', types: ['TENNIS', 'PICKLEBALL', 'BADMINTON', 'SQUASH'] },
  { label: 'Team', types: ['BASKETBALL', 'FOOTBALL', 'VOLLEYBALL', 'FRISBEE'] },
  { label: 'Combat', types: ['BOXING', 'MARTIAL_ARTS'] },
  { label: 'Other', types: ['CLIMB', 'GOLF', 'SKATEBOARD', 'DANCE'] },
  { label: 'Wellness', types: ['YOGA', 'MEDITATION', 'BREATHWORK', 'ICE_BATH', 'SAUNA'] },
  { label: 'More', types: ['BOOK_CLUB', 'NUTRITION', 'ANYTHING'] },
]

export default function HostWavesPage() {
  const [waves, setWaves] = useState<Wave[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [activityType, setActivityType] = useState('')
  const [area, setArea] = useState('')
  const [thought, setThought] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')

  const fetchWaves = useCallback(async () => {
    try {
      const res = await fetch('/api/wave/my-activities')
      if (res.ok) {
        const data = await res.json()
        setWaves(data.activities || [])
      }
    } catch {
      toast.error('Failed to load waves')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWaves()
  }, [fetchWaves])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityType || !area.trim()) {
      toast.error('Activity type and area are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          area: area.trim(),
          thought: thought.trim() || undefined,
          scheduledFor: scheduledFor || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create wave')
      }

      toast.success('Wave created! Others can now join.')
      setShowForm(false)
      setActivityType('')
      setArea('')
      setThought('')
      setScheduledFor('')
      fetchWaves()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create wave')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (waveId: string) => {
    setDeletingId(waveId)
    try {
      const res = await fetch(`/api/wave/${waveId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Wave deleted')
      setWaves((prev) => prev.filter((w) => w.id !== waveId))
    } catch {
      toast.error('Failed to delete wave')
    } finally {
      setDeletingId(null)
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  const timeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`
  }

  const activeWaves = waves.filter((w) => !isExpired(w.expiresAt))
  const expiredWaves = waves.filter((w) => isExpired(w.expiresAt))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Waves</h1>
          <p className="text-neutral-500 mt-1">
            Start a wave and rally people for spontaneous activities
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Wave'}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Start a Wave</h2>

          {/* Activity Type Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Activity Type *
            </label>
            <div className="space-y-3">
              {ACTIVITY_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.types.map((type) => {
                      const info = WAVE_ACTIVITIES[type as keyof typeof WAVE_ACTIVITIES]
                      if (!info) return null
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActivityType(type)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            activityType === type
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {info.emoji} {info.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Area / Location *
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g., East Coast Park, Marina Bay"
              maxLength={200}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Thought */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Quick thought (optional)
            </label>
            <input
              type="text"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="e.g., Chill pace, first timers welcome"
              maxLength={140}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="text-xs text-neutral-400 mt-1">{thought.length}/140</p>
          </div>

          {/* Scheduled For */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Schedule for later (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="text-xs text-neutral-400 mt-1">Leave empty to start the wave now (expires in 8 hours)</p>
          </div>

          <button
            type="submit"
            disabled={creating || !activityType || !area.trim()}
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Start Wave'}
          </button>
        </form>
      )}

      {/* Active Waves */}
      {activeWaves.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Active Waves</h2>
          <div className="space-y-3">
            {activeWaves.map((wave) => {
              const info = WAVE_ACTIVITIES[wave.activityType as keyof typeof WAVE_ACTIVITIES]
              return (
                <div
                  key={wave.id}
                  className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{info?.emoji || '?'}</span>
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {info?.label || wave.activityType} in {wave.area}
                        </h3>
                        {wave.thought && (
                          <p className="text-sm text-neutral-500 mt-0.5">{wave.thought}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {wave.participantCount}/{wave.waveThreshold}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {timeRemaining(wave.expiresAt)}
                          </span>
                          {wave.isUnlocked && (
                            <span className="flex items-center gap-1 text-green-600">
                              <MessageCircle className="w-3.5 h-3.5" />
                              Crew unlocked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(wave.id)}
                      disabled={deletingId === wave.id}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expired Waves */}
      {expiredWaves.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-500 mb-3">Past Waves</h2>
          <div className="space-y-3 opacity-60">
            {expiredWaves.slice(0, 10).map((wave) => {
              const info = WAVE_ACTIVITIES[wave.activityType as keyof typeof WAVE_ACTIVITIES]
              return (
                <div
                  key={wave.id}
                  className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{info?.emoji || '?'}</span>
                    <div>
                      <h3 className="font-medium text-neutral-700">
                        {info?.label || wave.activityType} in {wave.area}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {wave.participantCount} joined
                        </span>
                        {wave.isUnlocked && (
                          <span className="flex items-center gap-1 text-green-500">
                            <MessageCircle className="w-3.5 h-3.5" />
                            Crew formed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {waves.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-4xl block mb-4">🏄</span>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No waves yet</h2>
          <p className="text-neutral-500 mb-4">
            Start a wave to find people for spontaneous workouts
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Start Your First Wave
          </button>
        </div>
      )}
    </div>
  )
}
