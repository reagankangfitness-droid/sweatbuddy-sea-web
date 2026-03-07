'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Search } from 'lucide-react'
import { MemberRow, type Member } from './MemberRow'

type SortKey = 'lastSeen' | 'events' | 'name'
type FilterKey = 'all' | 'attended'

interface MemberListProps {
  members: Member[]
  onMembersChange: (members: Member[]) => void
  filter: FilterKey
  onFilterChange: (f: FilterKey) => void
  sort: SortKey
  onSortChange: (s: SortKey) => void
  search: string
  onSearchChange: (s: string) => void
}

export function MemberList({
  members,
  onMembersChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: MemberListProps) {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const handleToggle = (email: string, currentNotes: string | null) => {
    if (expandedEmail === email) {
      setExpandedEmail(null)
    } else {
      setExpandedEmail(email)
      setEditingNotes(currentNotes || '')
    }
  }

  const handleSaveNotes = async (email: string) => {
    setSavingNotes(true)
    try {
      const res = await fetch('/api/host/community/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notes: editingNotes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')

      onMembersChange(
        members.map((m) =>
          m.email.toLowerCase() === email.toLowerCase()
            ? { ...m, notes: editingNotes || null }
            : m
        )
      )
      setExpandedEmail(null)
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white bg-neutral-950 text-neutral-100"
          />
        </div>

        <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900'
            }`}
          >
            All RSVPs
          </button>
          <button
            onClick={() => onFilterChange('attended')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === 'attended'
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900'
            }`}
          >
            Attended Only
          </button>
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="px-4 py-2.5 border border-neutral-800 rounded-lg text-sm bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <option value="lastSeen">Last Seen</option>
          <option value="events">Most Sessions</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Member List */}
      {members.length === 0 ? (
        <div className="p-12 bg-neutral-900 rounded-xl text-center">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="font-medium text-neutral-100 mb-1">No members yet</p>
          <p className="text-sm text-neutral-500">
            When people RSVP to your experiences, they&apos;ll show up here
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.email}
              member={member}
              isExpanded={expandedEmail === member.email}
              editingNotes={editingNotes}
              savingNotes={savingNotes}
              onToggle={() => handleToggle(member.email, member.notes)}
              onNotesChange={setEditingNotes}
              onSaveNotes={() => handleSaveNotes(member.email)}
              onCancelNotes={() => setExpandedEmail(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
