'use client'

import { OverlayView } from '@react-google-maps/api'
import { ACTIVITIES } from '@/lib/im-down/constants'
import type { ImDownActivity } from '@prisma/client'

export interface NearbyUser {
  id: string
  userId: string
  activityType: ImDownActivity
  statusText: string | null
  latitude: number
  longitude: number
  distanceKm: number
  userName: string | null
  userImageUrl: string | null
  userFirstName: string | null
  userHeadline: string | null
  userInstagram: string | null
}

interface UserMapPinProps {
  user: NearbyUser
  onClick: () => void
}

export function UserMapPin({ user, onClick }: UserMapPinProps) {
  const activity = ACTIVITIES[user.activityType]

  return (
    <OverlayView
      position={{ lat: user.latitude, lng: user.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className="relative -translate-x-1/2 -translate-y-1/2 group"
        aria-label={`${user.userFirstName || user.userName || 'User'} - ${activity.label}`}
      >
        {/* Avatar circle */}
        <div className="w-12 h-12 rounded-full border-[3px] border-emerald-400 overflow-hidden bg-neutral-200 dark:bg-neutral-700 shadow-lg group-hover:scale-110 transition-transform">
          {user.userImageUrl ? (
            <img
              src={user.userImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-bold text-lg">
              {(user.userFirstName || user.userName || '?')[0]}
            </div>
          )}
        </div>

        {/* Activity emoji badge */}
        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center text-sm shadow-md border border-neutral-200 dark:border-neutral-600">
          {activity.emoji}
        </span>
      </button>
    </OverlayView>
  )
}
