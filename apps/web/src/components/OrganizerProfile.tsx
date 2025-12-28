'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Instagram, CheckCircle2, Calendar, Users } from 'lucide-react'

interface OrganizerData {
  id?: string
  name: string
  handle: string
  imageUrl?: string | null
  bio?: string | null
  eventsHosted?: number
  totalAttendees?: number
  isVerified?: boolean
}

interface OrganizerProfileProps {
  handle: string
  className?: string
}

// Generate consistent color based on handle
function getOrganizerColor(handle: string): string {
  const colors = [
    'from-rose-400 to-rose-500',
    'from-amber-400 to-amber-500',
    'from-emerald-400 to-emerald-500',
    'from-sky-400 to-sky-500',
    'from-violet-400 to-violet-500',
    'from-pink-400 to-pink-500',
  ]
  const index = handle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

export function OrganizerProfile({ handle, className = '' }: OrganizerProfileProps) {
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizer() {
      try {
        const res = await fetch(`/api/organizers/${handle}`)
        if (res.ok) {
          const data = await res.json()
          setOrganizer(data.organizer)
        } else {
          // Fallback to basic info
          setOrganizer({
            name: handle,
            handle: handle,
          })
        }
      } catch {
        setOrganizer({
          name: handle,
          handle: handle,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizer()
  }, [handle])

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-200" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-neutral-200 rounded" />
            <div className="h-3 w-32 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!organizer) return null

  const gradientColor = getOrganizerColor(handle)

  return (
    <div className={className}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {organizer.imageUrl ? (
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-neutral-100">
              <Image
                src={organizer.imageUrl}
                alt={organizer.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white font-bold text-xl`}>
              {organizer.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Verified badge */}
          {organizer.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900 truncate">
              {organizer.name}
            </h4>
          </div>

          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            @{handle}
          </a>

          {/* Bio */}
          {organizer.bio && (
            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
              {organizer.bio}
            </p>
          )}

          {/* Stats */}
          {(organizer.eventsHosted || organizer.totalAttendees) && (
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
              {organizer.eventsHosted && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {organizer.eventsHosted} events
                </span>
              )}
              {organizer.totalAttendees && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {organizer.totalAttendees} attendees
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for cards
export function OrganizerProfileCompact({
  handle,
  imageUrl,
  className = '',
}: {
  handle: string
  imageUrl?: string | null
  className?: string
}) {
  const gradientColor = getOrganizerColor(handle)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {imageUrl ? (
        <div className="relative w-6 h-6 rounded-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={handle}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      ) : (
        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white font-semibold text-[10px]`}>
          {handle.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm text-neutral-600">@{handle}</span>
    </div>
  )
}
