'use client'

import { memo } from 'react'
import { OverlayView } from '@react-google-maps/api'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

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

// Build lookup maps from the authoritative category list
const emojiByKey: Record<string, string> = {}
const colorByKey: Record<string, string> = {}
for (const cat of ACTIVITY_CATEGORIES) {
  emojiByKey[cat.slug] = cat.emoji
  emojiByKey[cat.name.toLowerCase()] = cat.emoji
  colorByKey[cat.slug] = cat.color
  colorByKey[cat.name.toLowerCase()] = cat.color
}

function getEmoji(activity: HostedActivityData): string {
  if (activity.categorySlug) {
    return emojiByKey[activity.categorySlug.toLowerCase()] || '📍'
  }
  return emojiByKey[activity.type.toLowerCase()] || '📍'
}

function getColor(activity: HostedActivityData): string {
  if (activity.categorySlug) {
    return colorByKey[activity.categorySlug.toLowerCase()] || '#3B82F6'
  }
  return colorByKey[activity.type.toLowerCase()] || '#3B82F6'
}

const PIN_OFFSET = { x: -24, y: -24 }
const getOffset = () => PIN_OFFSET

export const ActivityBubblePin = memo(function ActivityBubblePin({ activity, onClick }: ActivityBubblePinProps) {
  const emoji = getEmoji(activity)
  const color = getColor(activity)

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
        {/* Main circle — category emoji */}
        <div
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-neutral-800 border-[2.5px] ring-2 ring-opacity-20 overflow-hidden"
          style={{ borderColor: color, boxShadow: `0 0 0 4px ${color}33` }}
        >
          <span className="text-2xl leading-none">{emoji}</span>
        </div>

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
