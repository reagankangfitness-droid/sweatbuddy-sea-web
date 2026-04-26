'use client'

import { useEffect, useState } from 'react'

interface Badge {
  id: string
  name: string
  emoji: string
  earned: boolean
}

interface StatsData {
  totalSessions: number
  weeklyStreak: number
  favoriteActivity: { slug: string; emoji: string; label: string } | null
  memberSince: string | null
  badges: Badge[]
}

export default function ProfileStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data) => {
        setStats({
          totalSessions: data.totalSessions ?? 0,
          weeklyStreak: data.weeklyStreak ?? 0,
          favoriteActivity: data.favoriteActivity ?? null,
          memberSince: data.memberSince ?? null,
          badges: data.badges ?? [],
        })
      })
      .catch(() => {
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] p-4 mb-8 animate-pulse">
        <div className="h-5 bg-[#333333] rounded w-48 mb-3" />
        <div className="h-4 bg-[#333333] rounded w-36 mb-2" />
        <div className="h-4 bg-[#333333] rounded w-40 mb-4" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-[#333333] rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const memberDate = stats.memberSince
    ? new Date(stats.memberSince).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] p-4 mb-8">
      {/* Stats row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-white font-bold text-lg">{stats.totalSessions}</span>
        <span className="text-[#999999] text-sm">
          {stats.totalSessions === 1 ? 'session' : 'sessions'}
        </span>
        <span className="text-[#555555] text-sm mx-1">&middot;</span>
        <span className="text-white font-bold text-lg">{stats.weeklyStreak}</span>
        <span className="text-[#999999] text-sm">-week streak</span>
        {stats.weeklyStreak >= 3 && <span className="text-sm">🔥</span>}
      </div>

      {/* Member since */}
      {memberDate && (
        <p className="text-[#666666] text-xs mt-1">Showing up since {memberDate}</p>
      )}

      {/* Favorite activity */}
      {stats.favoriteActivity && (
        <p className="text-[#999999] text-sm mt-1.5">
          Favorite: {stats.favoriteActivity.emoji} {stats.favoriteActivity.label}
        </p>
      )}

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#333333]">
          {stats.badges.map((badge) => (
            <span
              key={badge.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                badge.earned
                  ? 'bg-[#2A2A2A] text-white'
                  : 'bg-[#1A1A1A] border border-[#333333] text-[#555555]'
              }`}
              title={badge.name}
            >
              <span>{badge.emoji}</span>
              <span>{badge.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
