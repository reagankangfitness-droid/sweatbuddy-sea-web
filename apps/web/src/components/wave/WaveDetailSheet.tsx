'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
  currentUserId?: string | null
  onDeleteWave?: (waveId: string) => Promise<void>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `Started ${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `Started ${hrs}h ago`
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hrs > 0) return `Expires in ${hrs}h ${mins}m`
  return `Expires in ${mins}m`
}

export function WaveDetailSheet({ wave, onClose, onJoin, onOpenChat, isParticipant, currentUserId, onDeleteWave }: WaveDetailSheetProps) {
  const [joining, setJoining] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (!wave) return
    setCountdown(formatCountdown(wave.expiresAt))
    const timer = setInterval(() => setCountdown(formatCountdown(wave.expiresAt)), 30000)
    return () => clearInterval(timer)
  }, [wave])

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
                <span className="text-orange-500 font-medium">{countdown}</span>
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

        {/* Thought bubble */}
        {wave.thought && (
          <div className="mx-4 mt-2 flex items-start gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
              {wave.creatorImageUrl ? (
                <Image src={wave.creatorImageUrl} alt={wave.creatorName || ''} width={28} height={28} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                  {(wave.creatorName || '?')[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 mb-0.5">{wave.creatorName || 'Anonymous'}</p>
              <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200">
                {wave.thought}
              </div>
            </div>
          </div>
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

          {currentUserId && wave.creatorId === currentUserId && onDeleteWave && (
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to delete this wave? This cannot be undone.')) return
                setDeleting(true)
                try {
                  await onDeleteWave(wave.id)
                  onClose()
                } catch {
                  // silent
                }
                setDeleting(false)
              }}
              disabled={deleting}
              className="w-full mt-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Wave'}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
