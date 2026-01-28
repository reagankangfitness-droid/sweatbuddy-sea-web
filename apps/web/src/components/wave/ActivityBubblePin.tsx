'use client'

import { memo } from 'react'
import { OverlayView } from '@react-google-maps/api'
import Image from 'next/image'

export interface HostedActivityData {
  id: string
  title: string
  description: string | null
  categorySlug: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  address: string | null
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  imageUrl: string | null
  price: number
  currency: string
  participantCount: number
  hostName: string | null
  hostImageUrl: string | null
  hostId: string
}

interface ActivityBubblePinProps {
  activity: HostedActivityData
  onClick: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  run: '🏃', yoga: '🧘', gym: '💪', cycle: '🚴', swim: '🏊',
  hike: '🥾', tennis: '🎾', pickleball: '🏓', basketball: '🏀',
  badminton: '🏸', football: '⚽', climb: '🧗', boxing: '🥊',
  dance: '💃', pilates: '🤸', walk: '🚶',
}

function getEmoji(activity: HostedActivityData): string {
  if (activity.categorySlug) {
    return CATEGORY_EMOJI[activity.categorySlug.toLowerCase()] || '📍'
  }
  return CATEGORY_EMOJI[activity.type.toLowerCase()] || '📍'
}

const PIN_OFFSET = { x: -24, y: -24 }
const getOffset = () => PIN_OFFSET

export const ActivityBubblePin = memo(function ActivityBubblePin({ activity, onClick }: ActivityBubblePinProps) {
  const emoji = getEmoji(activity)
  const hasHost = !!activity.hostImageUrl

  return (
    <OverlayView
      position={{ lat: activity.latitude, lng: activity.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={getOffset}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center pointer-events-auto"
        style={{ willChange: 'transform' }}
      >
        {/* Main circle */}
        <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-neutral-800 border-[2.5px] border-blue-500 ring-2 ring-blue-500/20">
          {hasHost ? (
            <Image
              src={activity.hostImageUrl!}
              alt={activity.hostName || 'Host'}
              width={44}
              height={44}
              className="w-full h-full rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xl leading-none">{emoji}</span>
          )}
        </div>

        {/* Emoji badge (top-right, shows when host image is used) */}
        {hasHost && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-sm border border-neutral-200 dark:border-neutral-700">
            {emoji}
          </span>
        )}

        {/* Participant count badge (bottom-right) */}
        {activity.participantCount > 0 && (
          <span className="absolute -bottom-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {activity.participantCount}
          </span>
        )}

        {/* Pointer triangle */}
        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-blue-500 -mt-[1px]" />
      </button>
    </OverlayView>
  )
})
