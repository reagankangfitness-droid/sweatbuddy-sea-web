'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

interface Participant {
  id: string
  name: string | null
  imageUrl: string | null
}

// Generate consistent color based on name
function getAvatarColor(name: string | null): string {
  const colors = [
    'from-rose-400 to-rose-500',
    'from-amber-400 to-amber-500',
    'from-emerald-400 to-emerald-500',
    'from-sky-400 to-sky-500',
    'from-violet-400 to-violet-500',
    'from-pink-400 to-pink-500',
    'from-teal-400 to-teal-500',
    'from-orange-400 to-orange-500',
  ]
  const str = name || 'anonymous'
  const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

interface AvatarStackProps {
  participants: Participant[]
  maxDisplay?: number
  maxPeople?: number | null
  size?: 'sm' | 'md' | 'xs'
  showGoingText?: boolean
  showEmptyState?: boolean
}

export function AvatarStack({
  participants,
  maxDisplay = 4,
  maxPeople,
  size = 'sm',
  showGoingText = false,
  showEmptyState = false,
}: AvatarStackProps) {
  const displayedParticipants = participants.slice(0, maxDisplay)
  const surplus = participants.length - maxDisplay
  const totalJoined = participants.length

  // Responsive sizes - smaller on mobile, larger on desktop
  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-5 h-5 sm:w-6 sm:h-6 text-[9px] sm:text-[10px]',
    md: 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs',
  }

  const avatarSize = sizeClasses[size]

  // Empty state - no attendees yet
  if (totalJoined === 0 && showEmptyState) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm">👋</span>
        <span className="text-xs text-muted-foreground">Join this session</span>
      </div>
    )
  }

  // Don't render if no participants and not showing empty state
  if (totalJoined === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {displayedParticipants.map((participant, index) => (
          <div
            key={participant.id}
            className={cn(
              avatarSize,
              'relative rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden',
              'shadow-sm',
              'transition-all duration-200 hover:scale-110 hover:z-20 hover:shadow-md'
            )}
            style={{ zIndex: maxDisplay - index }}
            title={participant.name || 'Anonymous'}
          >
            {participant.imageUrl ? (
              <Image
                src={participant.imageUrl}
                alt={participant.name || 'Participant'}
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <span className={cn(
                'font-semibold bg-gradient-to-br text-white w-full h-full flex items-center justify-center',
                getAvatarColor(participant.name)
              )}>
                {participant.name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        ))}

        {surplus > 0 && (
          <div
            className={cn(
              avatarSize,
              'rounded-full border-2 border-white',
              'bg-muted text-muted-foreground',
              'flex items-center justify-center font-semibold',
              'shadow-sm'
            )}
            style={{ zIndex: 0 }}
            title={`${surplus} more participants`}
          >
            +{surplus}
          </div>
        )}
      </div>

      {/* "X going" text - responsive */}
      {showGoingText && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap">{totalJoined} going</span>
        </div>
      )}

      {/* Legacy: spots filled display */}
      {maxPeople && !showGoingText && (
        <p className="text-xs text-muted-foreground">
          {totalJoined}/{maxPeople} spots filled
        </p>
      )}
    </div>
  )
}
