'use client'

import { Users, Activity, RefreshCw, UserPlus } from 'lucide-react'

interface CommunityStatsProps {
  totalMembers: number
  activeThisMonth: number
  retentionRate: number
  newMembers: number
}

export function CommunityStats({ totalMembers, activeThisMonth, retentionRate, newMembers }: CommunityStatsProps) {
  const stats = [
    {
      label: 'Total Members',
      value: totalMembers,
      icon: Users,
      color: 'text-neutral-100',
    },
    {
      label: 'Active This Month',
      value: activeThisMonth,
      icon: Activity,
      color: 'text-green-400',
    },
    {
      label: 'Retention Rate',
      value: `${retentionRate}%`,
      icon: RefreshCw,
      color: retentionRate >= 50 ? 'text-green-400' : retentionRate >= 25 ? 'text-amber-400' : 'text-red-400',
    },
    {
      label: 'New Members',
      value: newMembers,
      suffix: 'last 30d',
      icon: UserPlus,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-neutral-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 font-medium">{stat.label}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>
            {stat.value}
          </p>
          {stat.suffix && (
            <p className="text-xs text-neutral-600 mt-0.5">{stat.suffix}</p>
          )}
        </div>
      ))}
    </div>
  )
}
