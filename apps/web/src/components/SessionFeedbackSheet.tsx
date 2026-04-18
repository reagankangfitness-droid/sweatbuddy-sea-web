'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Flag, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SessionFeedbackSheetProps {
  open: boolean
  onClose: () => void
  sessionId: string
  sessionTitle: string
  hostId: string
  hostName: string | null
}

export function SessionFeedbackSheet({
  open,
  onClose,
  sessionId,
  sessionTitle,
  hostId,
  hostName,
}: SessionFeedbackSheetProps) {
  const [step, setStep] = useState<'feedback' | 'report' | 'done'>('feedback')
  const [submitting, setSubmitting] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const REPORT_REASONS = [
    { value: 'NO_SHOW', label: "Host didn't show up" },
    { value: 'FELT_UNSAFE', label: 'Felt unsafe' },
    { value: 'MISLEADING', label: 'Misleading description' },
    { value: 'HARASSMENT', label: 'Harassment or inappropriate behavior' },
    { value: 'OTHER', label: 'Other' },
  ]

  async function submitFeedback(positive: boolean) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/buddy/sessions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: sessionId,
          hostId,
          rating: positive ? 5 : 2,
          positive,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit')
        return
      }
      if (positive) {
        toast.success('Thanks for the feedback!')
        onClose()
        resetState()
      } else {
        setStep('report')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReport() {
    if (!reportReason) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/buddy/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedType: 'USER',
          reportedId: hostId,
          activityId: sessionId,
          reason: reportReason,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit report')
        return
      }
      toast.success("Report submitted. We'll review it within 24 hours.")
      setStep('done')
      setTimeout(() => { onClose(); resetState() }, 1500)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function resetState() {
    setTimeout(() => {
      setStep('feedback')
      setReportReason('')
    }, 300)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => { onClose(); resetState() }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-black/[0.1]" />
            </div>

            <div className="px-5 pb-[env(safe-area-inset-bottom,20px)]">
              {/* Step 1: Quick feedback */}
              {step === 'feedback' && (
                <div className="py-4">
                  <div className="text-center mb-5">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      How was {sessionTitle}?
                    </h3>
                    <p className="text-xs text-[#666666] mt-1">
                      Hosted by {hostName ?? 'the host'}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center mb-4">
                    <button
                      onClick={() => submitFeedback(true)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border border-black/[0.06] hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-7 h-7 text-emerald-600" />
                      <span className="text-xs font-semibold text-[#999999]">Great</span>
                    </button>

                    <button
                      onClick={() => submitFeedback(false)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border border-black/[0.06] hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-7 h-7 text-red-500" />
                      <span className="text-xs font-semibold text-[#999999]">Not great</span>
                    </button>
                  </div>

                  <button
                    onClick={() => { onClose(); resetState() }}
                    className="w-full text-center text-xs text-[#666666] py-2"
                  >
                    Skip
                  </button>
                </div>
              )}

              {/* Step 2: Report reason */}
              {step === 'report' && (
                <div className="py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">What went wrong?</h3>
                      <p className="text-xs text-[#666666] mt-0.5">Your report is confidential</p>
                    </div>
                    <button onClick={() => { onClose(); resetState() }} className="w-8 h-8 rounded-full bg-[#0D0D0D] flex items-center justify-center">
                      <X className="w-4 h-4 text-[#666666]" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReportReason(r.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                          reportReason === r.value
                            ? 'bg-[#1A1A1A] text-white font-semibold'
                            : 'bg-[#0D0D0D] text-[#999999] border border-[#333333] hover:border-[#666666]'
                        }`}
                      >
                        {r.value === 'NO_SHOW' && <Flag className="w-3.5 h-3.5 inline mr-2" />}
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={submitReport}
                    disabled={!reportReason || submitting}
                    className="w-full py-3 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit report
                  </button>
                </div>
              )}

              {/* Step 3: Done */}
              {step === 'done' && (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">✓</div>
                  <p className="text-sm font-semibold text-white">Report submitted</p>
                  <p className="text-xs text-[#666666] mt-1">We&apos;ll review it within 24 hours</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
