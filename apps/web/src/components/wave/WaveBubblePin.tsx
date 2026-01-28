'use client'

import { OverlayView } from '@react-google-maps/api'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

export interface WaveData {
  id: string
  creatorId: string
  activityType: WaveActivityType
  area: string
  locationName: string | null
  latitude: number | null
  longitude: number | null
  scheduledFor: string | null
  waveThreshold: number
  isUnlocked: boolean
  startedAt: string
  expiresAt: string
  chatId: string | null
  participantCount: number
  distanceKm: number | null
  creatorName: string | null
  creatorImageUrl: string | null
}

interface WaveBubblePinProps {
  wave: WaveData
  onClick: () => void
}

export function WaveBubblePin({ wave, onClick }: WaveBubblePinProps) {
  if (wave.latitude == null || wave.longitude == null) return null

  const activity = WAVE_ACTIVITIES[wave.activityType]
  const isRecent = Date.now() - new Date(wave.startedAt).getTime() < 5 * 60 * 1000
  const remaining = wave.waveThreshold - wave.participantCount
  const isAlmostUnlocked = !wave.isUnlocked && remaining === 1

  return (
    <OverlayView
      position={{ lat: wave.latitude, lng: wave.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center -ml-10 -mt-8"
      >
        <div
          className={`
            flex flex-col items-center justify-center
            px-3 py-1.5 rounded-2xl
            bg-white dark:bg-neutral-800 shadow-lg
            border-2 transition-all
            ${wave.isUnlocked ? 'border-emerald-500' : 'border-neutral-200 dark:border-neutral-600'}
            ${isRecent ? 'animate-pulse' : ''}
          `}
        >
          <div className="flex items-center gap-1">
            <span className="text-base leading-none">{activity.emoji}</span>
            <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 max-w-[80px] truncate">
              {wave.area}
            </span>
          </div>
          <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 leading-tight">
            {wave.participantCount}/{wave.waveThreshold} 🙋
          </span>
        </div>
        {isAlmostUnlocked && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
            1 more!
          </span>
        )}
      </button>
    </OverlayView>
  )
}
