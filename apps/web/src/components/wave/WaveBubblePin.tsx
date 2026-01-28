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

  return (
    <OverlayView
      position={{ lat: wave.latitude, lng: wave.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center -ml-10 -mt-5"
      >
        <div className="relative">
          {/* Pulse for nearly unlocked */}
          {isAlmostUnlocked && (
            <div className="absolute inset-0 rounded-2xl bg-orange-500 animate-pulse opacity-20" />
          )}

          {/* Main pill bubble */}
          <div
            className={`px-3 py-2 rounded-2xl shadow-lg flex items-center gap-2 bg-white dark:bg-neutral-800 ${
              wave.isUnlocked
                ? 'ring-2 ring-emerald-400'
                : isRecent
                  ? 'animate-pulse'
                  : ''
            }`}
          >
            <span className="text-xl">{activity.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 max-w-[80px] truncate">
                {wave.locationName || wave.area}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${
                  wave.isUnlocked
                    ? 'text-emerald-500'
                    : isAlmostUnlocked
                      ? 'text-orange-500'
                      : 'text-neutral-600 dark:text-neutral-300'
                }`}>
                  {wave.participantCount}/{wave.waveThreshold}
                </span>
                <span className="text-xs">🙋</span>
              </div>
            </div>
            {wave.isUnlocked && (
              <span className="text-emerald-500 text-sm">✓</span>
            )}
          </div>

          {/* "1 more!" badge */}
          {isAlmostUnlocked && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
              1 more!
            </div>
          )}
        </div>
      </button>
    </OverlayView>
  )
}
