'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Flag, X, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
  const [step, setStep] = useState<'feedback' | 'submitted' | 'report' | 'done'>('feedback')
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
        setStep('submitted')
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
            className="fixed inset-0 bg-[#17130E]/42 z-50"
            onClick={() => { onClose(); resetState() }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg border-x-2 border-t-2 border-[#17130E] bg-[#F4EFE3] text-[#17130E] shadow-[0_-4px_0_#17130E]"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-[#17130E]/20" />
            </div>

            <div className="px-5 pb-[env(safe-area-inset-bottom,20px)]">
              {/* Step 1: Quick feedback */}
              {step === 'feedback' && (
                <div className="py-4">
                  <div className="text-center mb-5">
                    <h3 className="text-base font-bold tracking-tight text-[#17130E]">
                      How was {sessionTitle}?
                    </h3>
                    <p className="mt-1 text-xs text-[#17130E]/62">
                      Hosted by {hostName ?? 'the host'}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center mb-4">
                    <button
                      onClick={() => submitFeedback(true)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-8 py-4 shadow-[2px_2px_0_#17130E] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                    >
                      <ThumbsUp className="w-7 h-7 text-emerald-600" />
                      <span className="text-xs font-semibold text-[#999999]">Great</span>
                    </button>

                    <button
                      onClick={() => submitFeedback(false)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-8 py-4 shadow-[2px_2px_0_#17130E] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                    >
                      <ThumbsDown className="w-7 h-7 text-red-500" />
                      <span className="text-xs font-semibold text-[#999999]">Not great</span>
                    </button>
                  </div>

                  <button
                    onClick={() => { onClose(); resetState() }}
                    className="w-full py-2 text-center text-xs text-[#17130E]/62"
                  >
                    Skip
                  </button>
                </div>
              )}

              {/* Step 1b: Positive feedback submitted — recap link */}
              {step === 'submitted' && (
                <div className="py-6 text-center">
                  <div className="text-3xl mb-2">&#127881;</div>
                  <p className="mb-1 text-sm font-semibold text-[#17130E]">Thanks for showing up!</p>
                  <Link
                    href={`/activities/${sessionId}/recap`}
                    onClick={() => { onClose(); resetState() }}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B4BA8] transition-colors hover:text-[#0D5BC8]"
                  >
                    See who showed up <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Step 2: Report reason */}
              {step === 'report' && (
                <div className="py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-[#17130E]">What went wrong?</h3>
                      <p className="mt-0.5 text-xs text-[#17130E]/62">Your report is confidential</p>
                    </div>
                    <button onClick={() => { onClose(); resetState() }} className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#17130E] bg-[#F8F4EA]">
                      <X className="h-4 w-4 text-[#17130E]" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReportReason(r.value)}
                        className={`w-full rounded-md border-2 px-4 py-3 text-left text-sm transition-all ${
                          reportReason === r.value
                            ? 'border-[#17130E] bg-[#0B4BA8] font-semibold text-white'
                            : 'border-[#17130E]/18 bg-[#F8F4EA] text-[#17130E] hover:border-[#17130E]'
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
                    className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-[#17130E] bg-red-600 py-3 text-sm font-semibold text-white shadow-[2px_2px_0_#17130E] transition-all hover:bg-red-700 disabled:opacity-40"
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
                  <p className="text-sm font-semibold text-[#17130E]">Report submitted</p>
                  <p className="mt-1 text-xs text-[#17130E]/62">We&apos;ll review it within 24 hours</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
