'use client'

import { useState } from 'react'
import { Loader2, X, Flag } from 'lucide-react'
import { toast } from 'sonner'

const REPORT_REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or fake' },
  { value: 'fake_profile', label: 'Fake profile or impersonation' },
  { value: 'scam', label: 'Scam or misleading' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
]

interface ReportModalProps {
  reportedType: 'USER' | 'ACTIVITY'
  reportedId: string
  reportedName?: string
  onClose: () => void
}

export function ReportModal({ reportedType, reportedId, reportedName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) {
      toast.error('Select a reason')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/buddy/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedType,
          reportedId,
          reason: details ? `${reason}: ${details}` : reason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit report')
        return
      }

      setSubmitted(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Report submitted</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Thanks for keeping SweatBuddies safe. We&apos;ll review this report.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-black"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-5">
              <Flag className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Report {reportedName ? `"${reportedName}"` : reportedType === 'USER' ? 'user' : 'session'}
              </h3>
            </div>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    reason === r.value
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      reason === r.value ? 'border-red-500 bg-red-500' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={2}
              maxLength={500}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />

            <button
              type="submit"
              disabled={submitting || !reason}
              className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Report
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
