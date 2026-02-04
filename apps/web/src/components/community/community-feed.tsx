'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, Users } from 'lucide-react'
import { FeedCard } from './feed-card'

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

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
              <div className="h-16 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CommunityFeed({
  tab,
  currentUserId,
}: {
  tab: 'all' | 'following'
  currentUserId: string | null
}) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const observerRef = useRef<HTMLDivElement | null>(null)

  const fetchFeed = useCallback(
    async (cursor?: string) => {
      if (!currentUserId) {
        // For non-authenticated, only allow "all" tab
        if (tab === 'following') {
          setItems([])
          setLoading(false)
          return
        }
      }

      try {
        const params = new URLSearchParams({ tab })
        if (cursor) params.set('cursor', cursor)

        const res = await fetch(`/api/community/feed?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()

        if (cursor) {
          setItems((prev) => [...prev, ...data.items])
        } else {
          setItems(data.items)
        }
        setNextCursor(data.nextCursor)
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [tab, currentUserId]
  )

  // Reset and fetch when tab changes
  useEffect(() => {
    setItems([])
    setNextCursor(null)
    setLoading(true)
    fetchFeed()
  }, [fetchFeed])

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !nextCursor) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true)
          fetchFeed(nextCursor)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)

    return () => observer.disconnect()
  }, [nextCursor, loadingMore, fetchFeed])

  const handleFollow = async (slug: string, actorId: string) => {
    try {
      const res = await fetch(`/api/profiles/${slug}/follow`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.following) {
          setFollowedIds((prev) => new Set([...prev, actorId]))
        }
      }
    } catch {
      // Silently handle errors
    }
  }

  if (loading) return <LoadingSkeleton />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          {tab === 'following' ? (
            <Users className="w-8 h-8 text-neutral-400" />
          ) : (
            <Calendar className="w-8 h-8 text-neutral-400" />
          )}
        </div>
        <p className="text-neutral-900 dark:text-white font-semibold mb-1">
          {tab === 'following' ? 'No activity yet' : 'No activity yet'}
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs">
          {tab === 'following'
            ? 'Follow people to see their activity here'
            : 'Be the first to join an event!'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          followedIds={followedIds}
          onFollow={handleFollow}
        />
      ))}

      {/* Infinite scroll trigger */}
      {nextCursor && (
        <div ref={observerRef} className="py-4">
          {loadingMore && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
