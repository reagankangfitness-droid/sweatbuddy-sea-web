'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Send, X, Loader2, Check } from 'lucide-react'

interface PostEventDraft {
  id: string
  eventId: string
  eventName: string
  eventDate: string | null
  attendeeCount: number
  category: string
  subject: string
  body: string
  createdAt: string
}

interface DraftModalState {
  draft: PostEventDraft
  subject: string
  body: string
  isSaving: boolean
  isSending: boolean
  sent: boolean
  sentCount: number | null
  error: string | null
}

export function PostEventDraftsSection() {
  const [drafts, setDrafts] = useState<PostEventDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState<DraftModalState | null>(null)

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await fetch('/api/host/post-event-drafts')
        if (!res.ok) return
        const data = await res.json()
        setDrafts(data.drafts || [])
      } catch {
        // Silent fail — non-critical section
      } finally {
        setIsLoading(false)
      }
    }
    fetchDrafts()
  }, [])

  const openModal = useCallback((draft: PostEventDraft) => {
    setModal({
      draft,
      subject: draft.subject,
      body: draft.body,
      isSaving: false,
      isSending: false,
      sent: false,
      sentCount: null,
      error: null,
    })
  }, [])

  const saveDraft = useCallback(async () => {
    if (!modal || modal.isSaving || modal.isSending || modal.sent) return

    setModal((prev) => (prev ? { ...prev, isSaving: true, error: null } : null))

    try {
      const res = await fetch(`/api/host/post-event-drafts/${modal.draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: modal.subject, body: modal.body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setModal((prev) => (prev ? { ...prev, isSaving: false } : null))
    } catch (err) {
      setModal((prev) =>
        prev
          ? {
              ...prev,
              isSaving: false,
              error: err instanceof Error ? err.message : 'Something went wrong',
            }
          : null
      )
    }
  }, [modal])

  const sendDraft = useCallback(async () => {
    if (!modal || modal.isSending || modal.sent) return

    // Save any pending edits first
    if (modal.subject !== modal.draft.subject || modal.body !== modal.draft.body) {
      setModal((prev) => (prev ? { ...prev, isSaving: true, error: null } : null))

      try {
        const saveRes = await fetch(`/api/host/post-event-drafts/${modal.draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: modal.subject, body: modal.body }),
        })

        if (!saveRes.ok) {
          const data = await saveRes.json()
          throw new Error(data.error || 'Failed to save changes')
        }
      } catch (err) {
        setModal((prev) =>
          prev
            ? {
                ...prev,
                isSaving: false,
                error: err instanceof Error ? err.message : 'Failed to save',
              }
            : null
        )
        return
      }
    }

    setModal((prev) => (prev ? { ...prev, isSaving: false, isSending: true, error: null } : null))

    try {
      const res = await fetch(`/api/host/post-event-drafts/${modal.draft.id}/send`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }

      const data = await res.json()
      setModal((prev) =>
        prev ? { ...prev, isSending: false, sent: true, sentCount: data.sentCount } : null
      )

      // Remove the sent draft from the list
      setDrafts((prev) => prev.filter((d) => d.id !== modal.draft.id))
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

  // Don't render anything while loading or if no drafts
  if (isLoading || drafts.length === 0) return null

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 bg-violet-50 border border-violet-200 rounded-xl">
          <h2 className="text-sm sm:text-base font-semibold text-violet-900 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-600" />
            Post-event emails ready to send
          </h2>
          <div className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-violet-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {draft.eventName}
                  </p>
                  <p className="text-xs text-violet-600">
                    {draft.attendeeCount} attendee{draft.attendeeCount !== 1 ? 's' : ''}
                    {draft.eventDate &&
                      ` · ${new Date(draft.eventDate).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                <button
                  onClick={() => openModal(draft)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-full transition-colors whitespace-nowrap"
                >
                  <Send className="w-3 h-3" />
                  Preview & Send
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-violet-700 mt-2">
            AI-drafted thank-you emails for your recent events. Review and send when ready.
          </p>
        </div>
      </div>

      {/* Draft Preview & Send Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !modal.isSending && !modal.isSaving && setModal(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">
                  Post-event email
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {modal.draft.eventName} · {modal.draft.attendeeCount} attendee
                  {modal.draft.attendeeCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => !modal.isSending && !modal.isSaving && setModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                disabled={modal.isSending || modal.isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {modal.sent ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    Emails sent!
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {modal.sentCount} attendee{modal.sentCount !== 1 ? 's' : ''} will receive your
                    thank-you email shortly.
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
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={modal.body}
                      onChange={(e) =>
                        setModal((prev) => (prev ? { ...prev, body: e.target.value } : null))
                      }
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
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
                    disabled={modal.isSending || modal.isSaving}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendDraft}
                    disabled={
                      modal.isSending ||
                      modal.isSaving ||
                      !modal.subject.trim() ||
                      !modal.body.trim()
                    }
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {modal.isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : modal.isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send to {modal.draft.attendeeCount} attendee
                        {modal.draft.attendeeCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
