'use client'

import { memo } from 'react'
import Image from 'next/image'
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
      mapPaneName={OverlayView.FLOAT_PANE}
      getPixelPositionOffset={getOffset}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center pointer-events-auto"
        style={{ willChange: 'transform', zIndex: 1000 }}
      >
        <div className="relative">
          {/* Animated pulse ring for waves */}
          <div className={`absolute -inset-2 rounded-3xl animate-pulse ${
            wave.isUnlocked
              ? 'bg-emerald-400/30'
              : isAlmostUnlocked
                ? 'bg-orange-400/30'
                : 'bg-cyan-400/30'
          }`} />

          {/* Main pill bubble - larger and more prominent */}
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border-3 ${
              wave.isUnlocked
                ? 'bg-emerald-100 dark:bg-emerald-800/60 border-emerald-500'
                : isAlmostUnlocked
                  ? 'bg-orange-100 dark:bg-orange-800/60 border-orange-500'
                  : 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-800/60 dark:to-blue-800/60 border-cyan-500'
            }`}
          >
            {/* Avatar with activity emoji badge - larger */}
            <div className="relative">
              {wave.creatorImageUrl ? (
                <Image
                  src={wave.creatorImageUrl}
                  alt={wave.creatorName || 'Creator'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-neutral-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-xl">
                  {activity.emoji}
                </div>
              )}
              {/* Activity emoji badge - only show if user has profile pic */}
              {wave.creatorImageUrl && (
                <span className="absolute -bottom-1 -right-1 text-base bg-white dark:bg-neutral-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-700">
                  {activity.emoji}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 max-w-[90px] truncate">
                {wave.locationName || wave.area}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${
                  wave.isUnlocked
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : isAlmostUnlocked
                      ? 'text-orange-600 dark:text-orange-300'
                      : 'text-cyan-600 dark:text-cyan-300'
                }`}>
                  {wave.participantCount}/{wave.waveThreshold}
                </span>
                <span className="text-sm">🙋</span>
              </div>
            </div>
            {wave.isUnlocked && (
              <span className="text-emerald-500 text-lg font-bold">✓</span>
            )}
          </div>

          {/* "1 more!" badge - more prominent */}
          {isAlmostUnlocked && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg animate-bounce">
              1 more!
            </div>
          )}
        </div>
      </button>
    </OverlayView>
  )
})
