'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { MessageCircle } from 'lucide-react'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import { CrewChatView } from './CrewChatView'
import type { WaveActivityType } from '@prisma/client'

interface Crew {
  chatId: string
  activityType: WaveActivityType
  area: string
  memberCount: number
  createdAt: string
  lastMessage: { content: string; senderName: string; createdAt: string } | null
  starterThought?: string | null
  starterName?: string | null
  starterImageUrl?: string | null
  locationName?: string | null
  scheduledFor?: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function CrewChatList() {
  const { user: clerkUser } = useUser()
  const [crews, setCrews] = useState<Crew[]>([])
  const [openChat, setOpenChat] = useState<Crew | null>(null)

  const fetchCrews = useCallback(async () => {
    try {
      const res = await fetch('/api/crew')
      const data = await res.json()
      if (data.crews) setCrews(data.crews)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchCrews()
    const interval = setInterval(fetchCrews, 30000)
    return () => clearInterval(interval)
  }, [fetchCrews])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Crews</h1>

      {crews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xs">
            No crews yet. Join activities on the map to form crews!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {crews.map((c) => {
            const activity = WAVE_ACTIVITIES[c.activityType]
            return (
              <button
                key={c.chatId}
                onClick={() => setOpenChat(c)}
                className="flex items-center gap-3 w-full bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">
                  {activity.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-neutral-900 dark:text-white truncate">
                      {activity.label} — {c.area}
                    </p>
                    <span className="text-xs text-neutral-400 shrink-0">{c.memberCount} members</span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {c.lastMessage
                      ? `${c.lastMessage.senderName}: ${c.lastMessage.content}`
                      : 'No messages yet'}
                  </p>
                </div>
                {c.lastMessage && (
                  <span className="text-xs text-neutral-400 shrink-0">
                    {timeAgo(c.lastMessage.createdAt)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Chat overlay */}
      {openChat && clerkUser && (
        <CrewChatView
          chatId={openChat.chatId}
          activityEmoji={WAVE_ACTIVITIES[openChat.activityType].emoji}
          area={openChat.area}
          currentUserId={clerkUser.id}
          onClose={() => setOpenChat(null)}
          starterThought={openChat.starterThought}
          starterName={openChat.starterName}
          starterImageUrl={openChat.starterImageUrl}
          locationName={openChat.locationName}
          scheduledFor={openChat.scheduledFor}
        />
      )}
    </div>
  )
}
