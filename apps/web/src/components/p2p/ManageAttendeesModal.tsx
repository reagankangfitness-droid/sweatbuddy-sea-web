'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, UserMinus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Attendee {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
}

interface ManageAttendeesModalProps {
  activityId: string
  attendees: Attendee[]
  onClose: () => void
  onAttendeeRemoved?: (userId: string) => void
}

export function ManageAttendeesModal({ activityId, attendees, onClose, onAttendeeRemoved }: ManageAttendeesModalProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [localAttendees, setLocalAttendees] = useState(attendees)

  async function handleRemove(userId: string) {
    setRemovingId(userId)
    try {
      const res = await fetch(`/api/buddy/sessions/${activityId}/remove-attendee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeUserId: userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to remove attendee')
        return
      }

      toast.success('Attendee removed')
      setLocalAttendees((prev) => prev.filter((a) => a.id !== userId))
      setConfirmingId(null)
      onAttendeeRemoved?.(userId)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Manage Attendees ({localAttendees.length})
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {localAttendees.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">No attendees yet</p>
          ) : (
            <div className="space-y-2">
              {localAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800"
                >
                  {attendee.imageUrl ? (
                    <Image
                      src={attendee.imageUrl}
                      alt={attendee.name ?? ''}
                      width={36}
                      height={36}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-500 flex-shrink-0">
                      {(attendee.name ?? '?')[0]}
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">
                    {attendee.name ?? 'Anonymous'}
                  </span>

                  {confirmingId === attendee.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(attendee.id)}
                        disabled={removingId === attendee.id}
                        className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        {removingId === attendee.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-xs text-neutral-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(attendee.id)}
                      className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
