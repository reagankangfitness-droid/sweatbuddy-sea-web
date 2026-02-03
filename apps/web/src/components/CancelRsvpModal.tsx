'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2, Check } from 'lucide-react'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface CancelRsvpModalProps {
  isOpen: boolean
  eventId: string
  eventName: string
  email: string
  onClose: () => void
  onSuccess: () => void
}

export function CancelRsvpModal({
  isOpen,
  eventId,
  eventName,
  email,
  onClose,
  onSuccess,
}: CancelRsvpModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState('')

  const handleCancel = async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/attendance/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel RSVP')
      }

      // Remove from localStorage going list
      const going = safeGetJSON<string[]>('sweatbuddies_going', [])
      const updated = going.filter((id: string) => id !== eventId)
      safeSetJSON('sweatbuddies_going', updated)

      // Show success state briefly before closing
      setIsCancelled(true)
      setTimeout(() => {
        onSuccess()
        onClose()
        setIsCancelled(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            <div className="p-6">
              {isCancelled ? (
                <>
                  {/* Success State */}
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 text-center mb-2">
                    You&apos;re off the list
                  </h2>
                  <p className="text-neutral-500 text-center">
                    No worries—maybe next time!
                  </p>
                </>
              ) : (
                <>
                  {/* Warning Icon */}
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>

                  <h2 className="text-xl font-bold text-neutral-900 text-center mb-2">
                    Can&apos;t make it?
                  </h2>

                  <p className="text-neutral-500 text-center mb-6">
                    No worries—we&apos;ll remove you from{' '}
                    <span className="font-medium text-neutral-700">{eventName}</span>.
                    You can always join again later.
                  </p>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4 text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                    >
                      Never Mind
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        'Yes, Remove Me'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
