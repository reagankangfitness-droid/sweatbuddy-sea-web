'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Bell, ArrowLeft, Check, CheckCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  link: string | null
  imageUrl: string | null
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'FRIEND_RSVP':
      return '🏃'
    case 'EVENT_REMINDER':
      return '⏰'
    case 'NEW_FOLLOWER':
      return '👋'
    case 'BUDDY_MATCH':
      return '🤝'
    case 'WAITLIST_PROMOTED':
      return '🎉'
    case 'HOST_ANNOUNCEMENT':
      return '📢'
    case 'EVENT_RECAP':
      return '📊'
    case 'PASSPORT_BADGE':
      return '🏅'
    case 'COMMUNITY_WELCOME':
      return '🏠'
    case 'STREAK_REMINDER':
      return '🔥'
    case 'MENTION':
      return '💬'
    case 'MESSAGE':
      return '✉️'
    case 'ACTIVITY_UPDATE':
      return '📋'
    case 'JOIN_REQUEST':
      return '🙋'
    case 'SYSTEM':
      return '⚙️'
    case 'NUDGE':
      return '👊'
    default:
      return '🔔'
  }
}

export default function NotificationsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) return
      const data = await res.json()
      if (cursor) {
        setNotifications((prev) => [...prev, ...data.notifications])
      } else {
        setNotifications(data.notifications)
      }
      setUnreadCount(data.unreadCount)
      setNextCursor(data.nextCursor ?? null)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }
    fetchNotifications().finally(() => setLoading(false))
  }, [isLoaded, isSignedIn, fetchNotifications])

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch {
      // silent
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    await fetchNotifications(nextCursor)
    setLoadingMore(false)
  }

  // Auth gate
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
        <div className="text-center">
          <Bell className="w-12 h-12 text-[#71717A] mx-auto mb-4" />
          <p className="text-white text-lg font-medium mb-2">Sign in to view notifications</p>
          <Link
            href="/sign-in"
            className="inline-block mt-4 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-sm font-semibold tracking-wider uppercase">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-white transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#71717A] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-[#71717A]" />
            </div>
            <p className="text-white text-base font-medium mb-1">No notifications yet</p>
            <p className="text-[#71717A] text-sm max-w-xs">
              When someone joins your session, follows you, or sends you a message, it will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => {
                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                      n.isRead
                        ? 'bg-transparent'
                        : 'bg-white/[0.02]'
                    } hover:bg-white/[0.04]`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-lg">
                      {n.imageUrl ? (
                        <Image
                          src={n.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        getNotificationIcon(n.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-snug">
                        {n.title}
                      </p>
                      {n.content && n.content !== n.title && (
                        <p className="text-[#71717A] text-xs mt-0.5 line-clamp-2">
                          {n.content}
                        </p>
                      )}
                      <p className="text-[#525252] text-[11px] mt-1">
                        {getTimeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot + mark read */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 pt-1">
                      {!n.isRead && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMarkRead(n.id)
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5 text-[#71717A]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )

                return n.link ? (
                  <Link key={n.id} href={n.link} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                )
              })}
            </div>

            {/* Load more */}
            {nextCursor && (
              <div className="flex justify-center py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 text-sm text-[#71717A] hover:text-white border border-white/[0.08] rounded-full transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
