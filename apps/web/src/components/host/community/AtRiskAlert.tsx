'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Member } from './MemberRow'

interface AtRiskAlertProps {
  members: Member[]
}

export function AtRiskAlert({ members }: AtRiskAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  // At-risk: no attendance in 3+ weeks AND previously had 3+ sessions
  const atRiskMembers = members.filter(
    (m) => m.status === 'at_risk' && m.eventsRSVPd >= 3
  )

  if (dismissed || atRiskMembers.length === 0) return null

  return (
    <div className="bg-amber-950/50 border border-amber-800/50 rounded-xl p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-amber-500 hover:text-amber-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-1">
            These members might be slipping away
          </h3>
          <p className="text-xs text-amber-500/80 mb-3">
            {atRiskMembers.length} regular{atRiskMembers.length !== 1 ? 's' : ''} haven&apos;t attended in 3+ weeks
          </p>
          <div className="flex flex-wrap gap-2">
            {atRiskMembers.slice(0, 5).map((m) => (
              <div
                key={m.email}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 rounded-lg"
              >
                <div className="w-6 h-6 bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-amber-300">
                    {(m.name?.[0] || m.email[0]).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-200 truncate">
                    {m.name || 'Anonymous'}
                  </p>
                  {m.lastEventDate && (
                    <p className="text-[10px] text-amber-500">
                      Last seen {new Date(m.lastEventDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {atRiskMembers.length > 5 && (
              <span className="self-center text-xs text-amber-500">
                +{atRiskMembers.length - 5} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
