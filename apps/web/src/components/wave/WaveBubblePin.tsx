'use client'

import { memo } from 'react'
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

const PIN_OFFSET = { x: -40, y: -20 }
const getOffset = () => PIN_OFFSET

export const WaveBubblePin = memo(function WaveBubblePin({ wave, onClick }: WaveBubblePinProps) {
  if (wave.latitude == null || wave.longitude == null) return null

  const activity = WAVE_ACTIVITIES[wave.activityType]
  const remaining = wave.waveThreshold - wave.participantCount
  const isAlmostUnlocked = !wave.isUnlocked && remaining === 1

  return (
    <OverlayView
      position={{ lat: wave.latitude, lng: wave.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={getOffset}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center pointer-events-auto"
        style={{ willChange: 'transform' }}
      >
        <div className="relative">
          {/* Pulse ring for nearly unlocked — static glow, no animation */}
          {isAlmostUnlocked && (
            <div className="absolute -inset-1 rounded-2xl bg-orange-400/25" />
          )}

          {/* Main pill bubble */}
          <div
            className={`px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 border-2 ${
              wave.isUnlocked
                ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400'
                : isAlmostUnlocked
                  ? 'bg-orange-50 dark:bg-orange-900/40 border-orange-400'
                  : 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/40 dark:to-blue-900/40 border-cyan-400/60 dark:border-cyan-500/60'
            }`}
          >
            <span className="text-xl">{activity.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 max-w-[80px] truncate">
                {wave.locationName || wave.area}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${
                  wave.isUnlocked
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isAlmostUnlocked
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-cyan-600 dark:text-cyan-400'
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
})
