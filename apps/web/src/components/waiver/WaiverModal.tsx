'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface WaiverModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
  attendanceId: string
  signeeEmail: string
  signeeName?: string
  onSuccess: () => void
}

interface WaiverData {
  enabled: boolean
  content: string | null
  templateId: string | null
  templateVersion: number | null
  templateName: string | null
  isCustom: boolean
}

export function WaiverModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  attendanceId,
  signeeEmail,
  signeeName,
  onSuccess,
}: WaiverModalProps) {
  const [mounted, setMounted] = useState(false)
  const [waiver, setWaiver] = useState<WaiverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch waiver content when modal opens
  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true)
      setError(null)
      fetch(`/api/events/${eventId}/waiver`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setWaiver(data)
          }
        })
        .catch(err => {
          console.error('Failed to load waiver:', err)
          setError('Failed to load waiver')
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, eventId])

  // Track scroll to ensure user reads the waiver
  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      // Consider "scrolled to bottom" if within 50px of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true)
      }
    }
  }

  // Check if content is short enough that no scroll is needed
  useEffect(() => {
    if (contentRef.current && waiver?.content) {
      const { scrollHeight, clientHeight } = contentRef.current
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true)
      }
    }
  }, [waiver])

  const handleSubmit = async () => {
    if (!agreed || !waiver?.content) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${eventId}/waiver/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId,
          signeeEmail,
          signeeName,
          signatureType: 'checkbox',
          agreedText: `I have read and agree to the waiver for "${eventName}"`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // If already signed, treat as success
        if (res.status === 409) {
          onSuccess()
          return
        }
        throw new Error(data.error || 'Failed to sign waiver')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign waiver')
    } finally {
      setSubmitting(false)
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl z-[9999] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900">Liability Waiver</h2>
                  <p className="text-sm text-neutral-500">Please read and agree to continue</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={onClose}
                      className="mt-4 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : waiver?.content ? (
                <>
                  {/* Waiver text */}
                  <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4"
                  >
                    <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {waiver.content}
                    </div>

                    {/* Scroll indicator */}
                    {!hasScrolledToBottom && (
                      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
                        <span className="text-xs text-neutral-500 bg-white px-3 py-1 rounded-full shadow-sm border border-neutral-200">
                          Scroll down to read the full waiver
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Agreement checkbox */}
                  <div className="p-4 border-t border-neutral-100 bg-neutral-50">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        disabled={!hasScrolledToBottom}
                        className="mt-0.5 w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-sm ${hasScrolledToBottom ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        I have read and agree to the waiver above. I understand and accept the risks involved in participating in <strong>{eventName}</strong>.
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-neutral-500">No waiver content available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {waiver?.content && (
              <div className="p-4 border-t border-neutral-100">
                <button
                  onClick={handleSubmit}
                  disabled={!agreed || submitting}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      I Agree & Continue
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
