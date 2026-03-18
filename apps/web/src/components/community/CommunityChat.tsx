'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { MessageCircle, Send, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string | null
    username: string | null
    imageUrl: string | null
  }
}

interface CommunityChatProps {
  communitySlug: string
  isMember: boolean
}

export function CommunityChat({ communitySlug, isMember }: CommunityChatProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/chat`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [communitySlug])

  // Fetch on mount + poll every 10s
  useEffect(() => {
    if (!isMember) {
      setLoading(false)
      return
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [isMember, fetchMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return

    // Optimistic message
    const optimisticMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id ?? '',
        name: user?.fullName ?? user?.firstName ?? null,
        username: user?.username ?? null,
        imageUrl: user?.imageUrl ?? null,
      },
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`/api/communities/${communitySlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to send message')
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
        setInput(content)
        return
      }

      // Refetch to get real message
      await fetchMessages()
    } catch {
      toast.error('Failed to send message')
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  // Non-member teaser
  if (!isMember) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="relative">
          {/* Blurred preview */}
          <div className="max-h-[200px] overflow-hidden p-4 blur-sm select-none pointer-events-none">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFFBF8] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-16 bg-[#FFFBF8] rounded mb-1" />
                    <div className="h-3 w-40 bg-[#FFFBF8] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-[#9A9AAA] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#4A4A5A]">Join to chat with the crew</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/[0.06] flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-[#9A9AAA]" />
        <h3 className="text-base font-semibold text-[#1A1A1A]">Crew Chat</h3>
        {!loading && (
          <span className="text-xs text-[#9A9AAA]">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className={`${expanded ? 'max-h-[400px]' : 'max-h-[220px]'} overflow-y-auto p-4 transition-all duration-300`}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#9A9AAA]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 text-[#9A9AAA] mx-auto mb-2" />
            <p className="text-sm text-[#9A9AAA]">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(expanded ? messages : messages.slice(-3)).map((msg) => {
              const isOwn = msg.sender.id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 rounded-lg px-2 py-1.5 ${isOwn ? 'bg-[#FFFBF8]' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                    {msg.sender.imageUrl ? (
                      <Image
                        src={msg.sender.imageUrl}
                        alt={msg.sender.name || ''}
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FFFBF8] flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-[#9A9AAA]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        {msg.sender.name || 'Member'}
                      </span>
                      <span className="text-[10px] text-[#9A9AAA]">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-[#4A4A5A] whitespace-pre-line break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* See all / collapse toggle */}
      {!loading && messages.length > 3 && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-[#9A9AAA] hover:text-[#4A4A5A] transition-colors"
          >
            {expanded ? 'Show less' : `See all ${messages.length} messages`}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-black/[0.06] px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#9A9AAA] bg-transparent outline-none"
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="bg-[#1A1A1A] text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40 transition-opacity flex items-center gap-1.5"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
