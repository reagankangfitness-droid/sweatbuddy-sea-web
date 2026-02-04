'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, ArrowRight, UserPlus } from 'lucide-react'
import { timeAgo } from '@/lib/time'

interface FeedItem {
  id: string
  type: 'event_joined' | 'activity_joined' | 'new_event' | 'new_follow'
  timestamp: string
  actor: {
    id: string
    name: string
    imageUrl: string | null
    slug: string | null
  }
  event?: {
    id: string
    name: string
    imageUrl: string | null
    category: string
    slug: string | null
    date: string | null
    location: string
  }
  target?: {
    id: string
    name: string
    imageUrl: string | null
    slug: string | null
  }
}

function Avatar({
  src,
  name,
  size = 'md',
}: {
  src: string | null
  name: string
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size === 'sm' ? 32 : 40}
        height={size === 'sm' ? 32 : 40}
        className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
        unoptimized
      />
    )
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${textSize} font-medium text-neutral-500 dark:text-neutral-400`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

function ActorLink({
  actor,
}: {
  actor: FeedItem['actor']
}) {
  const name = (
    <span className="font-semibold text-neutral-900 dark:text-white">
      {actor.name}
    </span>
  )

  if (actor.slug) {
    return <Link href={`/user/${actor.slug}`}>{name}</Link>
  }

  return name
}

function getEventUrl(item: FeedItem): string {
  if (!item.event) return '#'
  if (item.type === 'new_event' || item.type === 'event_joined') {
    if (item.event.slug) return `/e/${item.event.slug}`
    return `/e/${item.event.id}`
  }
  return `/activities/${item.event.id}`
}

function EventPreview({ item }: { item: FeedItem }) {
  if (!item.event) return null

  const url = getEventUrl(item)

  return (
    <Link
      href={url}
      className="mt-3 flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      {item.event.imageUrl ? (
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
          <Image
            src={item.event.imageUrl}
            alt={item.event.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-neutral-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 dark:text-white text-sm truncate">
          {item.event.name}
        </p>
        {item.event.category && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {item.event.category}
          </p>
        )}
        {item.event.date && (
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(item.event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
        {item.event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {item.event.location}
            </span>
          </div>
        )}
      </div>

      <ArrowRight className="w-4 h-4 text-neutral-400 self-center flex-shrink-0" />
    </Link>
  )
}

export function FeedCard({
  item,
  currentUserId,
  followedIds,
  onFollow,
}: {
  item: FeedItem
  currentUserId: string | null
  followedIds: Set<string>
  onFollow: (slug: string, actorId: string) => void
}) {
  const showFollowButton =
    currentUserId &&
    item.type !== 'new_follow' &&
    item.actor.id !== currentUserId &&
    item.actor.slug &&
    !followedIds.has(item.actor.id)

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
      <div className="flex items-start gap-3">
        {/* Actor avatar */}
        {item.actor.slug ? (
          <Link href={`/user/${item.actor.slug}`}>
            <Avatar src={item.actor.imageUrl} name={item.actor.name} />
          </Link>
        ) : (
          <Avatar src={item.actor.imageUrl} name={item.actor.name} />
        )}

        <div className="flex-1 min-w-0">
          {/* Activity text */}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <ActorLink actor={item.actor} />{' '}
            {item.type === 'event_joined' && 'joined'}
            {item.type === 'activity_joined' && 'joined'}
            {item.type === 'new_event' && 'listed a new event'}
            {item.type === 'new_follow' && (
              <>
                started following{' '}
                {item.target?.slug ? (
                  <Link
                    href={`/user/${item.target.slug}`}
                    className="font-semibold text-neutral-900 dark:text-white"
                  >
                    {item.target.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {item.target?.name}
                  </span>
                )}
              </>
            )}
            {(item.type === 'event_joined' || item.type === 'activity_joined') &&
              item.event && (
                <>
                  {' '}
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {item.event.name}
                  </span>
                </>
              )}
          </p>

          {/* Time ago */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {timeAgo(item.timestamp)}
          </p>

          {/* Event preview card */}
          {(item.type === 'event_joined' ||
            item.type === 'activity_joined' ||
            item.type === 'new_event') && <EventPreview item={item} />}

          {/* Follow target avatar for new_follow */}
          {item.type === 'new_follow' && item.target && (
            <div className="mt-3 flex items-center gap-2">
              {item.target.slug ? (
                <Link
                  href={`/user/${item.target.slug}`}
                  className="flex items-center gap-2"
                >
                  <Avatar
                    src={item.target.imageUrl}
                    name={item.target.name}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {item.target.name}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Avatar
                    src={item.target.imageUrl}
                    name={item.target.name}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {item.target.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Follow button */}
        {showFollowButton && (
          <button
            onClick={() => onFollow(item.actor.slug!, item.actor.id)}
            aria-label={`Follow ${item.actor.name}`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Follow
          </button>
        )}
      </div>
    </div>
  )
}
