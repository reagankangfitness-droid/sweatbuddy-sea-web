'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ACTIVITIES } from '@/lib/im-down/constants'
import type { ImDownActivity } from '@prisma/client'

interface StatusPickerProps {
  isOpen: boolean
  onClose: () => void
  onStatusSet: (activityType: ImDownActivity, statusText?: string) => void
}

const activityKeys = Object.keys(ACTIVITIES) as ImDownActivity[]

export function StatusPicker({ isOpen, onClose, onStatusSet }: StatusPickerProps) {
  const [selected, setSelected] = useState<ImDownActivity | null>(null)
  const [statusText, setStatusText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await onStatusSet(selected, statusText || undefined)
      setSelected(null)
      setStatusText('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-3xl px-6 pt-4 pb-[env(safe-area-inset-bottom,24px)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                What are you down for?
              </h2>
              <button onClick={onClose} className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Activity grid 2x3 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {activityKeys.map((key) => {
                const activity = ACTIVITIES[key]
                const isSelected = selected === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`flex flex-col items-center justify-center gap-1 py-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-2xl">{activity.emoji}</span>
                    <span className="text-sm font-medium">{activity.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Optional status text */}
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 mb-5 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="w-full py-4 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-lg disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Setting...' : "I'm Down"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
