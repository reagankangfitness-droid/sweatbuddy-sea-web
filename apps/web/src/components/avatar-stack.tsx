'use client'

import { cn } from '@/lib/utils'

interface Participant {
  id: string
  name: string | null
  imageUrl: string | null
}

interface AvatarStackProps {
  participants: Participant[]
  maxDisplay?: number
  maxPeople?: number | null
  size?: 'sm' | 'md'
}

export function AvatarStack({
  participants,
  maxDisplay = 8,
  maxPeople,
  size = 'sm',
}: AvatarStackProps) {
  const displayedParticipants = participants.slice(0, maxDisplay)
  const surplus = participants.length - maxDisplay
  const totalJoined = participants.length

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
  }

  const avatarSize = sizeClasses[size]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayedParticipants.map((participant, index) => (
            <div
              key={participant.id}
              className={cn(
                avatarSize,
                'rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden',
                'ring-1 ring-white/50 shadow-sm',
                'transition-transform hover:scale-110 hover:z-10'
              )}
              style={{ zIndex: maxDisplay - index }}
              title={participant.name || 'Anonymous'}
            >
              {participant.imageUrl ? (
                <img
                  src={participant.imageUrl}
                  alt={participant.name || 'Participant'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-medium text-muted-foreground">
                  {participant.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          ))}

          {surplus > 0 && (
            <div
              className={cn(
                avatarSize,
                'rounded-full border-2 border-background',
                'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
                'flex items-center justify-center font-semibold',
                'ring-1 ring-white/50 shadow-sm'
              )}
              style={{ zIndex: 0 }}
              title={`${surplus} more participants`}
            >
              +{surplus}
            </div>
          )}
        </div>
      </div>

      {maxPeople && (
        <p className="text-xs text-muted-foreground">
          {totalJoined}/{maxPeople} spots filled
        </p>
      )}
    </div>
  )
}
