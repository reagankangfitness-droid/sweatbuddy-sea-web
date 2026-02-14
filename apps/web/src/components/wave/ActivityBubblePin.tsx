'use client'

import { memo, useState } from 'react'
import { OverlayView } from '@react-google-maps/api'
import Image from 'next/image'
import { getCategoryEmoji, getCategoryColor } from '@/lib/categories'

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
  // Engagement signals
  isHappeningToday?: boolean
  isThisWeekend?: boolean
  spotsLeft?: number | null
  isFull?: boolean
  // Event submission specific
  isEventSubmission?: boolean
  recurring?: boolean
  eventTime?: string
}

interface ActivityBubblePinProps {
  activity: HostedActivityData
  onClick: () => void
}

function getEmoji(activity: HostedActivityData): string {
  const fromSlug = getCategoryEmoji(activity.categorySlug)
  if (fromSlug !== '✨') return fromSlug
  const fromType = getCategoryEmoji(activity.type)
  return fromType !== '✨' ? fromType : '📍'
}

function getColor(activity: HostedActivityData): string {
  const fromSlug = getCategoryColor(activity.categorySlug)
  if (fromSlug !== '#9CA3AF') return fromSlug
  const fromType = getCategoryColor(activity.type)
  return fromType !== '#9CA3AF' ? fromType : '#3B82F6'
}

const PIN_OFFSET = { x: -24, y: -24 }
const getOffset = () => PIN_OFFSET

export const ActivityBubblePin = memo(function ActivityBubblePin({ activity, onClick }: ActivityBubblePinProps) {
  const [imgError, setImgError] = useState(false)
  const emoji = getEmoji(activity)
  const color = getColor(activity)
  const displayImage = activity.imageUrl || activity.hostImageUrl
  const hasImage = !!displayImage && !imgError

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
        {/* Main circle — event image or emoji fallback */}
        <div
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-neutral-800 border-[2.5px] overflow-hidden"
          style={{ borderColor: color, boxShadow: `0 0 0 4px ${color}33` }}
        >
          {hasImage ? (
            <Image
              src={displayImage!}
              alt={activity.title || 'Event'}
              width={44}
              height={44}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <span className="text-2xl leading-none">{emoji}</span>
          )}
        </div>

        {/* Emoji badge (top-right) — always visible */}
        <span
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-sm border border-neutral-200 dark:border-neutral-700"
        >
          {emoji}
        </span>

        {/* Participant count badge (bottom-right) */}
        {activity.participantCount > 0 && (
          <span
            className="absolute -bottom-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
            style={{ backgroundColor: color }}
          >
            {activity.participantCount}
          </span>
        )}

        {/* Pointer triangle */}
        <div
          className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-[1px]"
          style={{ borderTopColor: color }}
        />
      </button>
    </OverlayView>
  )
})
