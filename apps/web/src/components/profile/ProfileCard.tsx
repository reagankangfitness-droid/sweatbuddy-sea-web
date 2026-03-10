'use client'

import Image from 'next/image'
import { User, Flame, CalendarCheck } from 'lucide-react'

interface ProfileCardProps {
  name: string
  imageUrl: string | null
  totalSessions: number
  currentStreak: number
  topCategory?: string | null
  memberSince?: string | null
}

/**
 * Compact profile card shown in attendee lists (hover/tap).
 * Displays key passport stats at a glance.
 */
export function ProfileCard({
  name,
  imageUrl,
  totalSessions,
  currentStreak,
  topCategory,
  memberSince,
}: ProfileCardProps) {
  return (
    <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-3 w-56 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-neutral-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-100 truncate">{name}</p>
          {memberSince && (
            <p className="text-xs text-neutral-500">Since {memberSince}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-neutral-400">
          <CalendarCheck className="w-3 h-3 text-emerald-400" />
          <span>{totalSessions} sessions</span>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-neutral-400">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>{currentStreak}w streak</span>
          </div>
        )}
      </div>

      {topCategory && (
        <p className="text-xs text-neutral-500 mt-1.5">
          Loves {topCategory}
        </p>
      )}
    </div>
  )
}
