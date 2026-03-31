'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, ChevronRight, Zap } from 'lucide-react'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'

const EMOJI_MAP = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.emoji]))

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

export default function HubClient({
  hostName,
  communities,
  upcomingSessions,
  totalMembers,
  activeThisMonth,
}: HubClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [shareSession, setShareSession] = useState<HubSession | null>(null)

  const nextSession = upcomingSessions[0]

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
      <div className="px-5 pt-[env(safe-area-inset-top,16px)] pb-4">
        <div className="pt-4">
          <p className="text-xs text-[#9A9AAA]">Welcome back</p>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{hostName ?? 'Host'}</h1>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Next session highlight */}
        {nextSession ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-2">Next session</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EMOJI_MAP[nextSession.categorySlug ?? ''] ?? '🏅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{nextSession.title}</p>
                <p className="text-xs text-[#71717A]">
                  {nextSession.startTime ? formatTime(nextSession.startTime) : 'No date'}
                  {nextSession.address ? ` · ${nextSession.address.split(',')[0]}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-[#1A1A1A]">{nextSession.goingCount}</p>
                <p className="text-[10px] text-[#9A9AAA]">
                  {nextSession.maxPeople ? `/ ${nextSession.maxPeople}` : 'going'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Link
                href={`/activities/${nextSession.id}`}
                className="flex-1 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold text-center"
              >
                See who&apos;s coming
              </Link>
              <button
                onClick={() => setShareSession(nextSession)}
                className="px-4 py-2 rounded-full border border-black/[0.06] text-xs font-semibold text-[#4A4A5A]"
              >
                Share
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Your community is set up!</p>
            <p className="text-xs text-[#71717A] mb-4">Post your first session — it takes 30 seconds.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              Post a session
            </button>
          </div>
        )}

        {/* Post session CTA */}
        {nextSession && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post a session
          </button>
        )}

        {/* This week */}
        {upcomingSessions.length > 1 && (
          <div>
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-3">This week</p>
            <div className="space-y-1">
              {upcomingSessions.slice(1).map((s) => (
                <Link
                  key={s.id}
                  href={`/activities/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] transition-all"
                >
                  <span className="text-lg">{EMOJI_MAP[s.categorySlug ?? ''] ?? '🏅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{s.title}</p>
                    <p className="text-xs text-[#9A9AAA]">{s.startTime ? formatTime(s.startTime) : ''}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#4A4A5A]">{s.goingCount} going</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Crew stats */}
        <div>
          <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-3">Your crew</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-black/[0.06] p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">{totalMembers}</p>
              <p className="text-xs text-[#9A9AAA]">Total members</p>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">{activeThisMonth}</p>
              <p className="text-xs text-[#9A9AAA]">Active this month</p>
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
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/[0.06] hover:border-black/[0.1] transition-all"
              >
                <span className="text-lg">{EMOJI_MAP[c.category] ?? '🏅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{c.name}</p>
                  <p className="text-xs text-[#9A9AAA]">{c.memberCount} members</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9A9AAA]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-2">
          <Link
            href="/host/analytics"
            className="flex-1 py-3 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-[#4A4A5A] text-center hover:border-black/[0.1] transition-all"
          >
            Analytics
          </Link>
          <Link
            href="/host/templates"
            className="flex-1 py-3 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-[#4A4A5A] text-center hover:border-black/[0.1] transition-all"
          >
            Recurring
          </Link>
          <Link
            href="/host/content"
            className="flex-1 py-3 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-[#4A4A5A] text-center hover:border-black/[0.1] transition-all"
          >
            Content
          </Link>
        </div>
      </div>
    </div>
  )
}
