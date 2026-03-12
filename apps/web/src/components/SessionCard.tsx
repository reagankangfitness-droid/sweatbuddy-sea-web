'use client'

import Link from 'next/link'
import { MapPin, Clock, Users, Lock, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface SessionCardSession {
  id: string
  title: string
  categorySlug: string | null
  activityMode: string
  startTime: string | null
  address: string | null
  city: string
  price: number
  maxPeople: number | null
  fitnessLevel: string | null
  requiresApproval: boolean
  imageUrl: string | null
  host: {
    id: string
    name: string | null
    imageUrl: string | null
    slug: string | null
    sessionsHostedCount: number
  }
  attendees: Array<{
    id: string
    name: string | null
    imageUrl: string | null
  }>
  attendeeCount: number
  isFull: boolean
  userStatus: string | null
}

interface SessionCardProps {
  session: SessionCardSession
  currentUserId?: string | null
  onJoin?: (id: string) => void
  onLeave?: (id: string) => void
  loading?: boolean
  className?: string
  /** When provided with no auth handlers, shows a sign-up CTA button */
  guestSignUpHref?: string
}

export function SessionCard({
  session,
  currentUserId,
  onJoin,
  onLeave,
  loading = false,
  className,
  guestSignUpHref,
}: SessionCardProps) {
  const isHost = currentUserId === session.host.id
  const isAttending = session.userStatus === 'JOINED' || session.userStatus === 'APPROVED'
  const isPending = session.userStatus === 'PENDING'
  const isFree = session.price === 0

  const spotsLeft = session.maxPeople ? session.maxPeople - session.attendeeCount : null
  const isAlmostFull = spotsLeft !== null && spotsLeft <= 3 && !session.isFull

  const activityType = session.categorySlug ?? 'other'
  const locationStr = session.address
    ? `${session.address}${session.city ? `, ${session.city}` : ''}`
    : session.city

  return (
    <div
      className={cn(
        'group flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden',
        'hover:border-neutral-700 transition-all duration-200',
        className
      )}
    >
      {/* Session image (if any) */}
      {session.imageUrl && (
        <Link href={`/activities/${session.id}`} className="block">
          <div className="relative h-40 overflow-hidden bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.imageUrl}
              alt={session.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Top row: badge + price */}
        <div className="flex items-start justify-between gap-2">
          <ActivityBadge type={activityType} />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {session.requiresApproval && (
              <span className="flex items-center gap-0.5 text-[10px] text-neutral-500">
                <Lock className="w-3 h-3" /> Approval
              </span>
            )}
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold',
                isFree
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-neutral-800 text-neutral-200'
              )}
            >
              {isFree ? 'FREE' : `$${session.price}`}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/activities/${session.id}`} className="block">
          <h3 className="font-semibold text-neutral-100 leading-snug line-clamp-2 hover:text-white transition-colors">
            {session.title}
          </h3>
        </Link>

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-sm text-neutral-500">
          {session.startTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDateTime(session.startTime)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{locationStr}</span>
          </div>
          {session.fitnessLevel && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="capitalize">{session.fitnessLevel.toLowerCase()}</span>
            </div>
          )}
        </div>

        {/* Spots warning */}
        {isAlmostFull && (
          <div className="text-xs text-amber-400 font-medium">
            Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left!
          </div>
        )}
        {session.isFull && (
          <div className="text-xs text-neutral-500 font-medium">Session full</div>
        )}

        {/* Divider */}
        <div className="border-t border-neutral-800 -mx-4" />

        {/* Host row */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <Link href={session.host.slug ? `/user/${session.host.slug}` : '#'}>
            <Avatar
              src={session.host.imageUrl}
              fallback={session.host.name ?? '?'}
              size="sm"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-300 truncate">
              {session.host.name ?? 'Anonymous'}
            </p>
            <p className="text-[11px] text-neutral-600">
              {session.host.sessionsHostedCount} session{session.host.sessionsHostedCount !== 1 ? 's' : ''} hosted
            </p>
          </div>

          {/* Attendee stack */}
          {session.attendeeCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {session.attendees.slice(0, 3).map((a) => (
                  <Avatar
                    key={a.id}
                    src={a.imageUrl}
                    fallback={a.name ?? '?'}
                    size="xs"
                    className="ring-1 ring-neutral-900"
                  />
                ))}
              </div>
              <span className="text-[11px] text-neutral-600 ml-0.5">
                <Users className="w-3 h-3 inline mr-0.5" />
                {session.attendeeCount}
                {session.maxPeople ? `/${session.maxPeople}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Action button — only when caller provides handlers (authenticated context) */}
        {!isHost && (onJoin || onLeave) && (
          <Button
            variant={isAttending ? 'secondary' : 'default'}
            size="sm"
            className="w-full mt-1"
            loading={loading}
            disabled={session.isFull && !isAttending && !isPending}
            onClick={(e) => {
              e.preventDefault()
              if (isAttending) {
                onLeave?.(session.id)
              } else {
                onJoin?.(session.id)
              }
            }}
          >
            {isAttending
              ? "You're going ✓"
              : isPending
              ? 'Pending approval…'
              : session.isFull
              ? 'Session full'
              : session.requiresApproval
              ? 'Request to join'
              : 'Join session'}
          </Button>
        )}

        {isHost && (onJoin || onLeave) && (
          <Link href={`/activities/${session.id}`} className="block">
            <Button variant="outline" size="sm" className="w-full mt-1">
              Manage session
            </Button>
          </Link>
        )}

        {/* Guest CTA — shown on public browse when no auth handlers provided */}
        {!onJoin && !onLeave && guestSignUpHref && !session.isFull && (
          <Link href={guestSignUpHref} className="block mt-1">
            <Button variant="default" size="sm" className="w-full">
              Sign up to join →
            </Button>
          </Link>
        )}
        {!onJoin && !onLeave && guestSignUpHref && session.isFull && (
          <p className="text-xs text-neutral-500 font-medium mt-1">Session full</p>
        )}
      </div>
    </div>
  )
}
