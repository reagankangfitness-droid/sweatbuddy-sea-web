'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'

interface ChatMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  senderName: string
  senderImageUrl: string | null
}

interface CrewChatViewProps {
  chatId: string
  activityEmoji: string
  area: string
  currentUserId: string
  onClose: () => void
  starterThought?: string | null
  starterName?: string | null
  starterImageUrl?: string | null
  locationName?: string | null
  scheduledFor?: string | null
}

export function CrewChatView({ chatId, activityEmoji, area, currentUserId, onClose, starterThought, starterName, starterImageUrl, locationName, scheduledFor }: CrewChatViewProps) {
  const STARTERS = starterName
    ? [
        `Hey ${starterName}, what's the plan?`,
        "I'm in! When are we meeting?",
        "Sounds great, count me in!",
      ]
    : [
        "Hey crew! When works for everyone?",
        "Anyone know a good spot nearby?",
        "I'm free now if anyone wants to go!",
      ]
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const prevCountRef = useRef(0)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/crew/${chatId}/messages`)
      if (!res.ok) return
      const data = await res.json()
      if (data.messages) {
        setMessages((prev) => {
          const ids = new Set(data.messages.map((m: ChatMessage) => m.id))
          // Only update if server has different messages
          if (prev.length === data.messages.length && prev.every((m) => ids.has(m.id))) return prev
          return data.messages
        })
      }
    } catch { /* silent */ }
  }, [chatId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Track scroll position
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const onScroll = () => {
      isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll only when new messages arrive and user is at bottom
  useEffect(() => {
    if (messages.length > prevCountRef.current && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = messages.length
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return
    setSending(true)
    const savedInput = input
    setInput('')
    try {
      const res = await fetch(`/api/crew/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        setInput(savedInput)
      } else {
        const data = await res.json()
        if (data.message) setMessages((prev) => [...prev, data.message])
      }
    } catch {
      setInput(savedInput)
    }
    setSending(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <X className="w-5 h-5" />
          </button>
          <span className="text-xl">{activityEmoji}</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{area}</span>
        </div>

        {/* Banner */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Crew formed! 🎉
        </div>

        {/* Pinned thought card */}
        {starterThought && (
          <div className="mx-4 mt-2 mb-1 flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
              {starterImageUrl ? (
                <Image src={starterImageUrl} alt={starterName || ''} width={32} height={32} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                  {(starterName || '?')[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{starterName || 'Anonymous'}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">{starterThought}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                {locationName && <span>📍 {locationName}</span>}
                {scheduledFor && (
                  <span>🕐 {new Date(scheduledFor).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-8">
              <p className="text-sm text-neutral-400">Start the conversation!</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${!isMe ? 'flex gap-2' : ''}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0 mt-1">
                      {msg.senderImageUrl ? (
                        <Image src={msg.senderImageUrl} alt="" className="w-full h-full object-cover" width={28} height={28} unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                          {(msg.senderName || '?')[0]}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    {!isMe && (
                      <p className="text-[10px] text-neutral-400 mb-0.5 ml-1">{msg.senderName}</p>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-br-md'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 pb-[env(safe-area-inset-bottom,12px)]">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none border border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-30 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
