'use client'

import { Check, Lock } from 'lucide-react'

interface Milestone {
  id: string
  label: string
  description: string
  achieved: boolean
  achievedDate?: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const tierColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  bronze: {
    bg: 'bg-amber-950/50',
    border: 'border-amber-800/50',
    text: 'text-amber-400',
    icon: 'text-amber-500',
  },
  silver: {
    bg: 'bg-neutral-800/50',
    border: 'border-neutral-600/50',
    text: 'text-neutral-300',
    icon: 'text-neutral-400',
  },
  gold: {
    bg: 'bg-yellow-950/50',
    border: 'border-yellow-700/50',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
  },
  platinum: {
    bg: 'bg-cyan-950/50',
    border: 'border-cyan-700/50',
    text: 'text-cyan-400',
    icon: 'text-cyan-500',
  },
}

export function MilestonesBadges({ milestones }: { milestones: Milestone[] }) {
  const achieved = milestones.filter(m => m.achieved)
  const locked = milestones.filter(m => !m.achieved)

  if (milestones.length === 0) return null

  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1 mb-3">
        Milestones ({achieved.length}/{milestones.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {achieved.map(m => {
          const colors = tierColors[m.tier]
          return (
            <div
              key={m.id}
              className={`${colors.bg} rounded-xl border ${colors.border} p-3 relative`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${colors.text} truncate`}>{m.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{m.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1 ${colors.bg}`}>
                  <Check className={`w-3 h-3 ${colors.icon}`} />
                </div>
              </div>
            </div>
          )
        })}
        {locked.slice(0, 2).map(m => (
          <div
            key={m.id}
            className="bg-neutral-950/50 rounded-xl border border-neutral-800/50 p-3 opacity-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-500 truncate">{m.label}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{m.description}</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1 bg-neutral-800">
                <Lock className="w-3 h-3 text-neutral-600" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
