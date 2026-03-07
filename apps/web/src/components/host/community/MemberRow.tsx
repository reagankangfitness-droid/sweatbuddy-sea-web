'use client'

import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'

export type MemberStatus = 'regular' | 'new' | 'at_risk' | 'active'

export interface Member {
  email: string
  name: string | null
  eventsRSVPd: number
  eventsAttended: number
  firstEventDate: string | null
  lastEventDate: string | null
  lastEventName: string | null
  totalSpent: number
  notes: string | null
  status: MemberStatus
}

const STATUS_BADGES: Record<MemberStatus, { label: string; className: string }> = {
  regular: { label: 'Regular', className: 'bg-green-900 text-green-400' },
  new: { label: 'New', className: 'bg-blue-900 text-blue-400' },
  at_risk: { label: 'At Risk', className: 'bg-amber-900 text-amber-400' },
  active: { label: 'Active', className: 'bg-neutral-800 text-neutral-400' },
}

interface MemberRowProps {
  member: Member
  isExpanded: boolean
  editingNotes: string
  savingNotes: boolean
  onToggle: () => void
  onNotesChange: (notes: string) => void
  onSaveNotes: () => void
  onCancelNotes: () => void
}

export function MemberRow({
  member,
  isExpanded,
  editingNotes,
  savingNotes,
  onToggle,
  onNotesChange,
  onSaveNotes,
  onCancelNotes,
}: MemberRowProps) {
  const badge = STATUS_BADGES[member.status]

  return (
    <div className="border-b border-neutral-800 last:border-0">
      {/* Main Row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-900 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="font-medium text-neutral-400">
              {(member.name?.[0] || member.email[0]).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-neutral-100 truncate">
                {member.name || 'Anonymous'}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                {badge.label}
              </span>
              {member.notes && (
                <span className="text-neutral-400" title="Has notes">
                  📝
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-neutral-100">
              {member.eventsRSVPd} session{member.eventsRSVPd !== 1 ? 's' : ''}
              {member.eventsAttended > 0 && (
                <span className="text-green-400 ml-1">
                  ({member.eventsAttended} attended)
                </span>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs text-neutral-500 justify-end">
              {member.firstEventDate && (
                <span>First: {new Date(member.firstEventDate).toLocaleDateString()}</span>
              )}
              {member.lastEventDate && (
                <span>Last: {new Date(member.lastEventDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Mobile stats (visible only on small screens when not expanded) */}
      {!isExpanded && (
        <div className="sm:hidden px-4 pb-3 -mt-2">
          <div className="flex items-center gap-3 text-xs text-neutral-500 ml-13">
            <span>{member.eventsRSVPd} session{member.eventsRSVPd !== 1 ? 's' : ''}</span>
            {member.lastEventDate && (
              <span>Last: {new Date(member.lastEventDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}

      {/* Expanded Notes Section */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-neutral-900">
          <div className="ml-13">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Notes about {member.name || 'this person'}
            </label>
            <textarea
              value={editingNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add notes... (e.g., prefers morning sessions, vegetarian)"
              className="w-full p-3 border border-neutral-800 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white bg-neutral-950 text-neutral-100"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-neutral-400">
                {member.totalSpent > 0 && `Total spent: $${(member.totalSpent / 100).toFixed(2)}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelNotes() }}
                  className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSaveNotes() }}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-50"
                >
                  {savingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
