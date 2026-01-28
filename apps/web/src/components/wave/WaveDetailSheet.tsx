'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin } from 'lucide-react'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import { formatDistance } from '@/lib/wave/geo'
import type { WaveData } from './WaveBubblePin'

interface WaveDetailSheetProps {
  wave: WaveData | null
  onClose: () => void
  onJoin: (waveId: string) => Promise<{ isUnlocked: boolean; chatId: string | null }>
  onOpenChat: (chatId: string) => void
  isParticipant: boolean
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `Started ${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `Started ${hrs}h ago`
}

export function WaveDetailSheet({ wave, onClose, onJoin, onOpenChat, isParticipant }: WaveDetailSheetProps) {
  const [joining, setJoining] = useState(false)

  if (!wave) return null

  const activity = WAVE_ACTIVITIES[wave.activityType]
  const progress = Math.min(wave.participantCount, wave.waveThreshold)
  const remaining = wave.waveThreshold - wave.participantCount

  const handleJoin = async () => {
    setJoining(true)
    try {
      const result = await onJoin(wave.id)
      if (result.isUnlocked && result.chatId) {
        onOpenChat(result.chatId)
        onClose()
      }
    } catch {
      // silent
    }
    setJoining(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-20 left-4 right-4 z-20 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activity.emoji}</span>
            <div>
              <p className="font-bold text-neutral-900 dark:text-white">
                {activity.label} in {wave.area}
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />{timeAgo(wave.startedAt)}
                </span>
                {wave.locationName && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />{wave.locationName}
                  </span>
                )}
              </div>
              {wave.scheduledFor && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {new Date(wave.scheduledFor).toLocaleString(undefined, {
                    weekday: 'short', hour: 'numeric', minute: '2-digit',
                  })}
                  {wave.locationName ? ` · ${wave.locationName}` : ''}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {wave.distanceKm != null && (
          <p className="px-4 text-xs text-neutral-400">{formatDistance(wave.distanceKm)} away</p>
        )}

        {/* Wave count */}
        <p className="px-4 pt-2 text-sm text-neutral-600 dark:text-neutral-300 font-medium">
          Waves: {wave.participantCount} of {wave.waveThreshold} needed
        </p>

        {/* Progress circles */}
        <div className="flex items-center justify-center gap-3 py-3">
          {Array.from({ length: wave.waveThreshold }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                i < progress
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-300 dark:text-neutral-600'
              }`}
            >
              {i < progress ? '🙋' : '?'}
            </div>
          ))}
        </div>

        {/* Status message */}
        <p className="text-center text-sm pb-2 font-medium">
          {wave.isUnlocked ? (
            <span className="text-emerald-600 dark:text-emerald-400">Crew unlocked! Chat is open.</span>
          ) : remaining === 1 ? (
            <span className="text-orange-500">🔥 Just 1 more wave to unlock!</span>
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400">
              {remaining} more to unlock crew chat
            </span>
          )}
        </p>

        {/* Action button */}
        <div className="px-4 pb-4">
          {wave.isUnlocked && wave.chatId ? (
            <button
              onClick={() => { onOpenChat(wave.chatId!); onClose() }}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm"
            >
              Enter crew chat 💬
            </button>
          ) : isParticipant ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold text-sm"
            >
              You&apos;ve waved 🙋 Waiting for {remaining} more...
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Wave to join 🙋'}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
