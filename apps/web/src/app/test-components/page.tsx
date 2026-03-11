'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/Avatar'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { FilterPills } from '@/components/ui/FilterPills'
import { EmptyState } from '@/components/ui/EmptyState'
import { SessionCard, type SessionCardSession } from '@/components/SessionCard'
import { useRouter } from 'next/navigation'

const MOCK_SESSION: SessionCardSession = {
  id: 'test-1',
  title: 'Morning 5K at Marina Bay — All Paces Welcome',
  categorySlug: 'running',
  activityMode: 'P2P_FREE',
  startTime: new Date(Date.now() + 86400000).toISOString(),
  address: 'Marina Bay Sands (waterfront)',
  city: 'Singapore',
  price: 0,
  maxPeople: 10,
  fitnessLevel: 'BEGINNER',
  requiresApproval: false,
  imageUrl: null,
  host: {
    id: 'host-1',
    name: 'Reagan Kang',
    imageUrl: null,
    slug: 'reagankang',
    sessionsHostedCount: 3,
  },
  attendees: [
    { id: 'u1', name: 'Alice Tan', imageUrl: null },
    { id: 'u2', name: 'Ben Lim', imageUrl: null },
    { id: 'u3', name: 'Clara Wu', imageUrl: null },
  ],
  attendeeCount: 3,
  isFull: false,
  userStatus: null,
}

const MOCK_SESSION_PAID: SessionCardSession = {
  ...MOCK_SESSION,
  id: 'test-2',
  title: 'Advanced Bootcamp — Sweat Lab Orchard',
  categorySlug: 'bootcamp',
  price: 15,
  requiresApproval: true,
  attendeeCount: 8,
  maxPeople: 8,
  isFull: true,
  userStatus: null,
}

const TYPE_PILLS = [
  { value: '', label: 'All', emoji: '✨' },
  { value: 'running', label: 'Running', emoji: '🏃' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'gym', label: 'Gym', emoji: '🏋️' },
  { value: 'cycling', label: 'Cycling', emoji: '🚴' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'bootcamp', label: 'Bootcamp', emoji: '🎖️' },
]

export default function TestComponentsPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState('')

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-3xl mx-auto space-y-14">
        <div>
          <h1 className="text-3xl font-bold mb-1">Design System</h1>
          <p className="text-neutral-500 text-sm">Component test page — /test-components</p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary (white)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="gradient">Gradient</Button>
            <Button loading loadingText="Joining...">Loading</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">XL</Button>
          </div>
        </section>

        {/* Avatars */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Avatars</h2>
          <div className="flex items-end gap-3">
            <Avatar fallback="RK" size="xs" />
            <Avatar fallback="SL" size="sm" />
            <Avatar fallback="MJ" size="md" />
            <Avatar fallback="DT" size="lg" />
            <Avatar fallback="YX" size="xl" />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Stacked:</span>
            <div className="flex -space-x-2">
              <Avatar fallback="RK" size="sm" className="ring-2 ring-neutral-950" />
              <Avatar fallback="AL" size="sm" className="ring-2 ring-neutral-950" />
              <Avatar fallback="BM" size="sm" className="ring-2 ring-neutral-950" />
            </div>
            <span>+5 more</span>
          </div>
        </section>

        {/* Activity Badges */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Activity Badges</h2>
          <div className="flex flex-wrap gap-2">
            {['running', 'cycling', 'yoga', 'gym', 'hiking', 'bootcamp', 'hiit', 'pilates', 'swimming', 'sports'].map(
              (type) => (
                <ActivityBadge key={type} type={type} />
              )
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {['running', 'yoga', 'gym'].map((type) => (
              <ActivityBadge key={type} type={type} size="sm" showIcon={false} />
            ))}
            <span className="text-xs text-neutral-600 self-center">sm / no icon</span>
          </div>
        </section>

        {/* Filter Pills */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Filter Pills</h2>
          <FilterPills pills={TYPE_PILLS} selected={typeFilter} onSelect={setTypeFilter} />
          <p className="text-xs text-neutral-600">Selected: &quot;{typeFilter || 'all'}&quot;</p>
        </section>

        {/* Session Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Session Cards</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <SessionCard
              session={MOCK_SESSION}
              currentUserId="different-user"
              onJoin={(id) => alert(`Join ${id}`)}
            />
            <SessionCard
              session={MOCK_SESSION_PAID}
              currentUserId="different-user"
              onJoin={(id) => alert(`Join ${id}`)}
            />
          </div>
          {/* Host view */}
          <div className="max-w-sm">
            <p className="text-xs text-neutral-600 mb-2">Host view:</p>
            <SessionCard session={MOCK_SESSION} currentUserId="host-1" />
          </div>
          {/* Attending view */}
          <div className="max-w-sm">
            <p className="text-xs text-neutral-600 mb-2">Attending view:</p>
            <SessionCard
              session={{ ...MOCK_SESSION, userStatus: 'JOINED' }}
              currentUserId="different-user"
              onLeave={(id) => alert(`Leave ${id}`)}
            />
          </div>
        </section>

        {/* Empty State */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-300 border-b border-neutral-800 pb-2">Empty State</h2>
          <div className="border border-neutral-800 rounded-2xl">
            <EmptyState
              icon="🏃"
              title="No sessions yet"
              description="Be the first to host a workout session in your area. It only takes 2 minutes."
              action={{ label: 'Host a Session', onClick: () => router.push('/buddy/host/new') }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
