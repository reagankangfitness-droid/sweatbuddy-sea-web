'use client'

import { OverlayView } from '@react-google-maps/api'

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

export function ActivityBubblePin({ activity, onClick }: ActivityBubblePinProps) {
  const emoji = getEmoji(activity)

  return (
    <OverlayView
      position={{ lat: activity.latitude, lng: activity.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className="relative flex flex-col items-center -ml-10 -mt-8"
      >
        <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950 shadow-lg border-2 border-blue-400 dark:border-blue-600">
          <div className="flex items-center gap-1">
            <span className="text-base leading-none">{emoji}</span>
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-200 max-w-[80px] truncate">
              {activity.title}
            </span>
          </div>
          {activity.startTime && (
            <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 leading-tight">
              {new Date(activity.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Event
        </span>
      </button>
    </OverlayView>
  )
}
