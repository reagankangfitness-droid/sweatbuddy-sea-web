'use client'

import { Flame, TrendingUp, Users, CalendarCheck } from 'lucide-react'

interface FitnessStats {
  totalSessions: number
  thisMonth: number
  uniqueCommunities: number
  currentStreak: number
  longestStreak: number
}

export function ProfileStats({ stats }: { stats: FitnessStats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-neutral-500">Sessions</p>
        </div>
        <p className="text-2xl font-bold text-neutral-100">{stats.totalSessions}</p>
        {stats.thisMonth > 0 && (
          <p className="text-xs text-neutral-500 mt-0.5">{stats.thisMonth} this month</p>
        )}
      </div>

      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-orange-400" />
          <p className="text-xs text-neutral-500">Streak</p>
        </div>
        <p className="text-2xl font-bold text-neutral-100">
          {stats.currentStreak}<span className="text-sm font-normal text-neutral-500">w</span>
        </p>
        {stats.longestStreak > stats.currentStreak && (
          <p className="text-xs text-neutral-500 mt-0.5">Best: {stats.longestStreak}w</p>
        )}
      </div>

      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-blue-400" />
          <p className="text-xs text-neutral-500">Communities</p>
        </div>
        <p className="text-2xl font-bold text-neutral-100">{stats.uniqueCommunities}</p>
      </div>

      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <p className="text-xs text-neutral-500">This Month</p>
        </div>
        <p className="text-2xl font-bold text-neutral-100">{stats.thisMonth}</p>
      </div>
    </div>
  )
}
