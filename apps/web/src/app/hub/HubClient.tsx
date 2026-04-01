'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, Zap, Copy, Check, MessageCircle, Bell, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'

const EMOJI_MAP = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.emoji]))
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://www.sweatbuddies.co'

interface HubAttendee {
  id: string
  name: string | null
  imageUrl: string | null
  isNew: boolean
}

interface HubSession {
  id: string
  title: string
  startTime: string | null
  address: string | null
  city: string | null
  communityId: string | null
  categorySlug: string | null
  maxPeople: number | null
  goingCount: number
  attendees?: HubAttendee[]
}

interface HubCommunity {
  id: string
  name: string
  slug: string
  memberCount: number
  category: string
}

interface HubClientProps {
  hostName: string | null
  communities: HubCommunity[]
  upcomingSessions: HubSession[]
  totalMembers: number
  activeThisMonth: number
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })
  if (isToday) return `Today ${time}`
  if (isTomorrow) return `Tomorrow ${time}`
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Singapore' }) + ` ${time}`
}

function getDayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Singapore' })
}

export default function HubClient({
  hostName,
  communities,
  upcomingSessions,
  totalMembers,
  activeThisMonth,
}: HubClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [shareSession, setShareSession] = useState<HubSession | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notifying, setNotifying] = useState<string | null>(null)

  const nextSession = upcomingSessions[0]

  // Group sessions by day for schedule view
  const dayGroups: { day: string; sessions: HubSession[] }[] = []
  for (const s of upcomingSessions) {
    if (!s.startTime) continue
    const day = getDayLabel(s.startTime)
    const existing = dayGroups.find((g) => g.day === day)
    if (existing) existing.sessions.push(s)
    else dayGroups.push({ day, sessions: [s] })
  }

  function copyLink(sessionId: string) {
    const url = `${BASE_URL}/activities/${sessionId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(sessionId)
      toast.success('Link copied!')
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => toast.error('Failed to copy'))
  }

  function shareWhatsApp(session: HubSession) {
    const url = `${BASE_URL}/activities/${session.id}`
    const time = session.startTime ? formatTime(session.startTime) : ''
    const loc = session.address?.split(',')[0] ?? ''
    const msg = `${session.title}${time ? ` — ${time}` : ''}${loc ? ` at ${loc}` : ''}\nRSVP here: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function notifyAttendees(session: HubSession) {
    setNotifying(session.id)
    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/notify`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to notify')
        return
      }
      toast.success(`Notified ${session.goingCount} attendee${session.goingCount !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setNotifying(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF8] pb-24">
      <CreateSessionSheet open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => window.location.reload()} />

      <ShareSessionSheet
        open={!!shareSession}
        onClose={() => setShareSession(null)}
        sessionId={shareSession?.id ?? ''}
        sessionTitle={shareSession?.title ?? ''}
        sessionTime={shareSession?.startTime}
        sessionLocation={shareSession?.address ?? shareSession?.city ?? undefined}
        spotsLeft={shareSession?.maxPeople ? shareSession.maxPeople - shareSession.goingCount : null}
        goingCount={shareSession?.goingCount ?? 0}
        context="created"
      />

      {/* Header */}
      <div className="px-5 pt-[env(safe-area-inset-top,16px)] pb-2">
        <div className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#9A9AAA]">Welcome back</p>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{hostName ?? 'Host'}</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-full bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/20 flex items-center justify-center hover:bg-[#E8612F] transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-5">

        {/* ── #5: Weekly schedule strip ── */}
        {dayGroups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {dayGroups.map((g) => (
              <div
                key={g.day}
                className="flex-shrink-0 bg-white rounded-xl shadow-sm px-3.5 py-2.5 min-w-[80px] text-center"
              >
                <p className="text-[11px] text-[#9A9AAA] font-medium uppercase">{g.day}</p>
                <p className="text-lg font-bold text-[#1A1A1A]">{g.sessions.length}</p>
                <p className="text-[10px] text-[#9A9AAA]">session{g.sessions.length !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Next session highlight ── */}
        {nextSession ? (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-2">Next session</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EMOJI_MAP[nextSession.categorySlug ?? ''] ?? '🏅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1A1A1A] truncate">{nextSession.title}</p>
                <p className="text-[12px] text-[#71717A]">
                  {nextSession.startTime ? formatTime(nextSession.startTime) : 'No date'}
                  {nextSession.address ? ` · ${nextSession.address.split(',')[0]}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-[#1A1A1A]">{nextSession.goingCount}</p>
                <p className="text-[10px] text-[#9A9AAA]">{nextSession.maxPeople ? `/ ${nextSession.maxPeople}` : 'going'}</p>
              </div>
            </div>

            {/* ── #1: Quick actions row ── */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyLink(nextSession.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FFFBF8] text-xs font-medium text-[#4A4A5A] hover:bg-neutral-100 transition-all"
              >
                {copiedId === nextSession.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === nextSession.id ? 'Copied' : 'Copy link'}
              </button>
              <button
                onClick={() => shareWhatsApp(nextSession)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#25D366]/10 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/20 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              {nextSession.goingCount > 0 && (
                <button
                  onClick={() => notifyAttendees(nextSession)}
                  disabled={notifying === nextSession.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FF6B35]/10 text-xs font-medium text-[#FF6B35] hover:bg-[#FF6B35]/20 disabled:opacity-50 transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {notifying === nextSession.id ? 'Sending...' : 'Notify'}
                </button>
              )}
            </div>

            {/* ── #2: Attendee preview ── */}
            <button
              onClick={() => setExpandedId(expandedId === nextSession.id ? null : nextSession.id)}
              className="w-full mt-3 pt-3 border-t border-black/[0.04] text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#9A9AAA] uppercase tracking-widest">
                  Who&apos;s coming ({nextSession.goingCount})
                </span>
                <ChevronRight className={`w-3.5 h-3.5 text-[#9A9AAA] transition-transform ${expandedId === nextSession.id ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {expandedId === nextSession.id && nextSession.attendees && (
              <div className="mt-2 space-y-1.5">
                {nextSession.attendees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.imageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-[#9A9AAA]">
                        {(a.name ?? '?')[0]}
                      </div>
                    )}
                    <span className="text-[12px] text-[#4A4A5A] flex-1">{a.name ?? 'Anonymous'}</span>
                    {a.isNew && (
                      <span className="text-[10px] text-[#FF6B35] font-medium">New!</span>
                    )}
                  </div>
                ))}
                {nextSession.goingCount > (nextSession.attendees?.length ?? 0) && (
                  <p className="text-[11px] text-[#9A9AAA]">+ {nextSession.goingCount - (nextSession.attendees?.length ?? 0)} more</p>
                )}
                <Link
                  href={`/activities/${nextSession.id}`}
                  className="block text-[11px] text-[#FF6B35] font-medium mt-1"
                >
                  View full list →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Your community is set up!</p>
            <p className="text-[12px] text-[#71717A] mb-4">Post your first session — it takes 30 seconds.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#1A1A1A] text-white text-[14px] font-semibold"
            >
              <Zap className="w-4 h-4" />
              Post a session
            </button>
          </div>
        )}

        {/* ── This week sessions ── */}
        {upcomingSessions.length > 1 && (
          <div>
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-3">Sessions</p>
            <div className="space-y-2">
              {upcomingSessions.slice(1).map((s) => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{EMOJI_MAP[s.categorySlug ?? ''] ?? '🏅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{s.title}</p>
                      <p className="text-[11px] text-[#9A9AAA]">{s.startTime ? formatTime(s.startTime) : ''}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-[#4A4A5A]">{s.goingCount}</span>
                  </div>
                  {/* Quick actions */}
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => copyLink(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FFFBF8] text-[10px] font-medium text-[#71717A] hover:bg-neutral-100"
                    >
                      {copiedId === s.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === s.id ? 'Copied' : 'Link'}
                    </button>
                    <button
                      onClick={() => shareWhatsApp(s)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#25D366]/10 text-[10px] font-medium text-[#25D366]"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Share
                    </button>
                    <Link
                      href={`/activities/${s.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-50 text-[10px] font-medium text-[#71717A]"
                    >
                      <UserCheck className="w-3 h-3" />
                      Attendees
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crew stats */}
        <div>
          <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-3">Your crew</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">{totalMembers}</p>
              <p className="text-[11px] text-[#9A9AAA]">Total members</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">{activeThisMonth}</p>
              <p className="text-[11px] text-[#9A9AAA]">Active this month</p>
            </div>
          </div>
        </div>

        {/* Communities */}
        <div>
          <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-3">Communities</p>
          <div className="space-y-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.slug}`}
                className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-lg">{EMOJI_MAP[c.category] ?? '🏅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{c.name}</p>
                  <p className="text-[11px] text-[#9A9AAA]">{c.memberCount} members</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9A9AAA]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-2">
          <Link href="/host/analytics" className="flex-1 py-3 rounded-xl bg-white shadow-sm text-[11px] font-medium text-[#4A4A5A] text-center hover:shadow-md transition-all">
            Analytics
          </Link>
          <Link href="/host/templates" className="flex-1 py-3 rounded-xl bg-white shadow-sm text-[11px] font-medium text-[#4A4A5A] text-center hover:shadow-md transition-all">
            Recurring
          </Link>
          <Link href="/host/content" className="flex-1 py-3 rounded-xl bg-white shadow-sm text-[11px] font-medium text-[#4A4A5A] text-center hover:shadow-md transition-all">
            Content
          </Link>
        </div>
      </div>
    </div>
  )
}
