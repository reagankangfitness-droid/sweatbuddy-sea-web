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
  thought: string | null
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

  const borderColor = wave.isUnlocked
    ? 'border-emerald-500 ring-emerald-500/20'
    : isAlmostUnlocked
      ? 'border-orange-500 ring-orange-500/20'
      : 'border-neutral-300 dark:border-neutral-600 ring-neutral-300/20 dark:ring-neutral-600/20'

  return (
    <OverlayView
      position={{ lat: wave.latitude, lng: wave.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center -ml-6 -mt-6"
      >
        {/* Main circle */}
        <div className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-neutral-800 border-[2.5px] ring-2 ${borderColor} ${isRecent ? 'animate-pulse' : ''}`}>
          <span className="text-xl leading-none">{activity.emoji}</span>
        </div>

        {/* Wave count badge (bottom-right) */}
        <span className={`absolute -bottom-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm ${
          wave.isUnlocked ? 'bg-emerald-500' : isAlmostUnlocked ? 'bg-orange-500' : 'bg-neutral-500 dark:bg-neutral-600'
        }`}>
          {wave.participantCount}/{wave.waveThreshold}
        </span>

        {/* Pointer triangle */}
        <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-[1px] ${
          wave.isUnlocked ? 'border-t-emerald-500' : isAlmostUnlocked ? 'border-t-orange-500' : 'border-t-neutral-300 dark:border-t-neutral-600'
        }`} />

        {/* "1 more!" label for almost-unlocked */}
        {isAlmostUnlocked && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
            1 more!
          </span>
        )}
      </button>
    </OverlayView>
  )
}
