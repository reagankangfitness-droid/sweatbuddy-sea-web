'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserMinus, Send, X, Loader2, Check, Clock } from 'lucide-react'

interface ColdMember {
  email: string
  name: string | null
  attendanceCount: number
  lastSeenDate: string
  daysSinceLastSeen: number
  onCooldown: boolean
  lastNudgedAt: string | null
}

interface UpcomingEvent {
  id: string
  name: string
  date: string | null
  slug: string | null
}

interface NudgeModalState {
  member: ColdMember
  subject: string
  message: string
  isGenerating: boolean
  isSending: boolean
  sent: boolean
  error: string | null
}

export function ReengagementSection() {
  const [members, setMembers] = useState<ColdMember[]>([])
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState<NudgeModalState | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/host/reengagement')
        if (!res.ok) return
        const data = await res.json()
        setMembers(data.members || [])
        setUpcomingEvent(data.upcomingEvent || null)
      } catch {
        // Silent fail — non-critical section
      } finally {
        setIsLoading(false)
      }
    }
    fetchMembers()
  }, [])

  const openNudgeModal = useCallback(
    async (member: ColdMember) => {
      setModal({
        member,
        subject: '',
        message: '',
        isGenerating: true,
        isSending: false,
        sent: false,
        error: null,
      })

      try {
        const res = await fetch('/api/host/reengagement/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberName: member.name,
            memberEmail: member.email,
            daysSince: member.daysSinceLastSeen,
            attendanceCount: member.attendanceCount,
            upcomingEventName: upcomingEvent?.name || null,
          }),
        })

        if (!res.ok) throw new Error('Failed to generate')
        const data = await res.json()

        setModal((prev) =>
          prev
            ? { ...prev, subject: data.subject, message: data.message, isGenerating: false }
            : null
        )
      } catch {
        setModal((prev) =>
          prev
            ? {
                ...prev,
                isGenerating: false,
                subject: `Hey ${member.name || 'there'}, we miss you!`,
                message: `It's been a while since we've seen you! We'd love to have you back at our next session.`,
              }
            : null
        )
      }
    },
    [upcomingEvent]
  )

  const sendNudge = useCallback(async () => {
    if (!modal || modal.isSending || modal.sent) return

    setModal((prev) => (prev ? { ...prev, isSending: true, error: null } : null))

    try {
      const res = await fetch('/api/host/reengagement/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: modal.member.email,
          recipientName: modal.member.name,
          subject: modal.subject,
          message: modal.message,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }

      setModal((prev) => (prev ? { ...prev, isSending: false, sent: true } : null))

      // Update the member in the list to show cooldown
      setMembers((prev) =>
        prev.map((m) =>
          m.email === modal.member.email
            ? { ...m, onCooldown: true, lastNudgedAt: new Date().toISOString() }
            : m
        )
      )
    } catch (err) {
      setModal((prev) =>
        prev
          ? {
              ...prev,
              isSending: false,
              error: err instanceof Error ? err.message : 'Something went wrong',
            }
          : null
      )
    }
  }, [modal])

  // Don't render anything while loading or if no cold members
  if (isLoading || members.length === 0) return null

  return (
    <>
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4 flex items-center gap-2">
          <UserMinus className="w-4 h-4 text-rose-500" />
          Members to re-engage
        </h2>
        <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50">
          <div className="divide-y divide-rose-100">
            {members.map((member) => (
              <div key={member.email} className="p-2.5 sm:p-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-rose-700">
                      {(member.name || member.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                      {member.name || member.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-rose-700">
                      {member.daysSinceLastSeen}d inactive · {member.attendanceCount} sessions
                    </p>
                  </div>
                  {member.onCooldown ? (
                    <span className="flex items-center gap-1 text-xs text-neutral-400 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => openNudgeModal(member)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-full transition-colors whitespace-nowrap"
                    >
                      <Send className="w-3 h-3" />
                      Nudge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 bg-rose-100 border-t border-rose-200">
            <p className="text-xs text-rose-800">
              Members who attended 2+ sessions but haven&apos;t been back in 3+ weeks.
            </p>
          </div>
        </div>
      </section>

      {/* Nudge Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !modal.isSending && setModal(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">
                  Send nudge
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  to {modal.member.name || modal.member.email}
                </p>
              </div>
              <button
                onClick={() => !modal.isSending && setModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                disabled={modal.isSending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {modal.isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  <span className="ml-2 text-sm text-neutral-500">Drafting message...</span>
                </div>
              ) : modal.sent ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    Nudge sent!
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {modal.member.name || modal.member.email} will receive your message shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={modal.subject}
                      onChange={(e) =>
                        setModal((prev) => (prev ? { ...prev, subject: e.target.value } : null))
                      }
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={modal.message}
                      onChange={(e) =>
                        setModal((prev) => (prev ? { ...prev, message: e.target.value } : null))
                      }
                      rows={5}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
                    />
                    <p className="text-xs text-neutral-400 mt-1">
                      AI-drafted. Edit freely before sending.
                    </p>
                  </div>
                  {modal.error && (
                    <p className="text-xs text-red-600">{modal.error}</p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!modal.isGenerating && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200">
                {modal.sent ? (
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setModal(null)}
                      disabled={modal.isSending}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendNudge}
                      disabled={modal.isSending || !modal.subject.trim() || !modal.message.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {modal.isSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send email
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
