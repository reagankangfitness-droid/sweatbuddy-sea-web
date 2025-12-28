'use client'

import Image from 'next/image'

interface Attendee {
  id: string
  name: string
  imageUrl?: string | null
}

interface AvatarStackProps {
  attendees: Attendee[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-2.5',
  lg: '-ml-3',
}

// Generate consistent colors based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-100 text-rose-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
    'bg-sky-100 text-sky-600',
    'bg-violet-100 text-violet-600',
    'bg-pink-100 text-pink-600',
    'bg-teal-100 text-teal-600',
    'bg-orange-100 text-orange-600',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AvatarStack({
  attendees,
  maxDisplay = 4,
  size = 'md',
  showCount = true,
  className = '',
}: AvatarStackProps) {
  const displayedAttendees = attendees.slice(0, maxDisplay)
  const remainingCount = Math.max(0, attendees.length - maxDisplay)

  if (attendees.length === 0) return null

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {displayedAttendees.map((attendee, index) => (
          <div
            key={attendee.id}
            className={`relative ${sizeClasses[size]} rounded-full ring-2 ring-white ${
              index > 0 ? overlapClasses[size] : ''
            } transition-transform hover:scale-110 hover:z-10`}
            style={{ zIndex: maxDisplay - index }}
          >
            {attendee.imageUrl ? (
              <Image
                src={attendee.imageUrl}
                alt={attendee.name}
                fill
                className="object-cover rounded-full"
                sizes="40px"
              />
            ) : (
              <div
                className={`w-full h-full rounded-full flex items-center justify-center font-medium ${getAvatarColor(
                  attendee.name
                )}`}
              >
                {getInitials(attendee.name)}
              </div>
            )}
          </div>
        ))}

        {/* Remaining count bubble */}
        {showCount && remainingCount > 0 && (
          <div
            className={`relative ${sizeClasses[size]} rounded-full ring-2 ring-white ${overlapClasses[size]} bg-neutral-100 flex items-center justify-center font-medium text-neutral-600`}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}

// Single avatar component for consistency
export function Avatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-14 h-14 text-base',
  }

  return (
    <div className={`relative ${sizes[size]} rounded-full overflow-hidden ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-medium ${getAvatarColor(name)}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}

// Avatar with name label
export function AvatarWithName({
  name,
  imageUrl,
  subtitle,
  size = 'md',
  className = '',
}: {
  name: string
  imageUrl?: string | null
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Avatar name={name} imageUrl={imageUrl} size={size} />
      <div className="min-w-0">
        <p className="font-medium text-neutral-900 truncate text-sm">{name}</p>
        {subtitle && (
          <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
