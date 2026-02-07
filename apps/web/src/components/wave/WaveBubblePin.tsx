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

const PIN_OFFSET = { x: -24, y: -24 }
const getOffset = () => PIN_OFFSET

export const WaveBubblePin = memo(function WaveBubblePin({ wave, onClick }: WaveBubblePinProps) {
  if (wave.latitude == null || wave.longitude == null) return null

  const activity = WAVE_ACTIVITIES[wave.activityType]
  const remaining = wave.waveThreshold - wave.participantCount
  const isAlmostUnlocked = !wave.isUnlocked && remaining === 1

  // Border color based on state
  const borderColor = wave.isUnlocked
    ? 'border-emerald-500'
    : isAlmostUnlocked
      ? 'border-orange-500'
      : 'border-cyan-500'

  const pulseColor = wave.isUnlocked
    ? 'bg-emerald-500/30'
    : isAlmostUnlocked
      ? 'bg-orange-500/30'
      : 'bg-cyan-500/30'

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
        {/* Animated pulse ring - differentiates from static events */}
        <div className={`absolute -inset-1.5 rounded-full animate-pulse ${pulseColor}`} />

        {/* Main circle */}
        <div className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-neutral-800 border-[2.5px] ${borderColor} overflow-hidden`}>
          {wave.creatorImageUrl ? (
            <Image
              src={wave.creatorImageUrl}
              alt={wave.creatorName || 'Creator'}
              width={44}
              height={44}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xl leading-none">{activity.emoji}</span>
          )}
        </div>

        {/* Activity emoji badge (top-right) */}
        {wave.creatorImageUrl && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-sm border border-neutral-200 dark:border-neutral-700">
            {activity.emoji}
          </span>
        )}

        {/* Wave count badge (bottom-right) - shows 🙋 + count */}
        <span className={`absolute -bottom-0.5 -right-1 min-w-[22px] h-[18px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm ${
          wave.isUnlocked
            ? 'bg-emerald-500'
            : isAlmostUnlocked
              ? 'bg-orange-500'
              : 'bg-cyan-500'
        }`}>
          {wave.participantCount}🙋
        </span>

        {/* Pointer triangle - cyan colored to match wave theme */}
        <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-[1px] ${
          wave.isUnlocked
            ? 'border-t-emerald-500'
            : isAlmostUnlocked
              ? 'border-t-orange-500'
              : 'border-t-cyan-500'
        }`} />
      </button>
    </OverlayView>
  )
})
