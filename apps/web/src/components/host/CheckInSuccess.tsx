'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'

interface CheckInSuccessProps {
  show: boolean
  attendee: {
    name: string | null
    email: string
    checkedInAt: string
  } | null
  error?: string | null
  alreadyCheckedIn?: boolean
  onClose: () => void
}

export function CheckInSuccess({
  show,
  attendee,
  error,
  alreadyCheckedIn,
  onClose,
}: CheckInSuccessProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {error ? (
              // Error state
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Check-in Failed
                </h3>
                <p className="text-neutral-600 mb-6">{error}</p>
              </>
            ) : alreadyCheckedIn ? (
              // Already checked in
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Already Checked In
                </h3>
                {attendee && (
                  <>
                    <p className="text-lg font-medium text-neutral-800">
                      {attendee.name || 'Guest'}
                    </p>
                    <p className="text-neutral-500 text-sm mb-2">
                      {attendee.email}
                    </p>
                    <p className="text-neutral-400 text-sm mb-6">
                      Checked in at{' '}
                      {new Date(attendee.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </>
                )}
              </>
            ) : (
              // Success state
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Checked In!
                </h3>
                {attendee && (
                  <>
                    <p className="text-lg font-medium text-neutral-800">
                      {attendee.name || 'Guest'}
                    </p>
                    <p className="text-neutral-500 text-sm mb-2">
                      {attendee.email}
                    </p>
                    <p className="text-neutral-400 text-sm mb-6">
                      {new Date(attendee.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
            >
              {error || alreadyCheckedIn ? 'Try Again' : 'Scan Next'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
