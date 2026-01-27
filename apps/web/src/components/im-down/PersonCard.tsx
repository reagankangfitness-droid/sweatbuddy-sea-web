'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Instagram } from 'lucide-react'
import { ACTIVITIES } from '@/lib/im-down/constants'
import { formatDistance } from '@/lib/im-down/geo'
import type { NearbyUser } from './UserMapPin'

interface PersonCardProps {
  user: NearbyUser | null
  onClose: () => void
  onMatch: (recipientId: string, activityType: string) => Promise<void>
}

export function PersonCard({ user, onClose, onMatch }: PersonCardProps) {
  const [loading, setLoading] = useState(false)
  const [matched, setMatched] = useState(false)

  if (!user) return null

  const activity = ACTIVITIES[user.activityType]

  const handleMatch = async () => {
    setLoading(true)
    try {
      await onMatch(user.userId, user.activityType)
      setMatched(true)
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

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

            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                {user.userImageUrl ? (
                  <img src={user.userImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-400">
                    {(user.userFirstName || user.userName || '?')[0]}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                  {user.userFirstName || user.userName || 'Anonymous'}
                </h3>
                {user.userHeadline && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {user.userHeadline}
                  </p>
                )}
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {formatDistance(user.distanceKm)} away
                </p>
              </div>

              <button onClick={onClose} className="p-2 -mt-1 -mr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Activity pill + status */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <span>{activity.emoji}</span>
                {activity.label}
              </span>
            </div>

            {user.statusText && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                &ldquo;{user.statusText}&rdquo;
              </p>
            )}

            {/* Instagram */}
            {user.userInstagram && (
              <a
                href={`https://instagram.com/${user.userInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 mb-5"
              >
                <Instagram className="w-4 h-4" />
                @{user.userInstagram.replace('@', '')}
              </a>
            )}

            {/* CTA */}
            {matched ? (
              <div className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg text-center">
                Matched! 🎉
              </div>
            ) : (
              <button
                onClick={handleMatch}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-lg disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Matching...' : "I'm Down Too"}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
