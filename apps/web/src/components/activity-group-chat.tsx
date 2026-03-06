'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { Send, Users, Pin, Lock, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  content: string
  isPinned: boolean
  isSystem?: boolean
  isIcebreaker?: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
}

interface ActivityGroupChatProps {
  activityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityGroupChat({
  activityId,
  open,
  onOpenChange,
}: ActivityGroupChatProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages from EventChat API
  const fetchMessages = useCallback(async (isPolling = false) => {
    try {
      const response = await fetch(`/api/events/${activityId}/chat/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setPinnedMessages(data.pinnedMessages || [])
        setIsHost(data.isHost || false)
        setIsReadOnly(data.isReadOnly || false)
        setParticipantCount(data.participantCount || 0)
        setHasMore(data.hasMore || false)
        setNextCursor(data.nextCursor || null)
        setIsLocked(false)
      } else if (response.status === 403) {
        const data = await response.json()
        if (data.locked) {
          setIsLocked(true)
        } else if (!isPolling) {
          toast.error(data.error || 'Cannot access this chat')
        }
      }
    } catch {
      // Silently handle polling errors
    } finally {
      setIsLoading(false)
    }
  }, [activityId])

  // Load older messages (cursor pagination)
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const response = await fetch(
        `/api/events/${activityId}/chat/messages?cursor=${encodeURIComponent(nextCursor)}`
      )
      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...(data.messages || []), ...prev])
        setHasMore(data.hasMore || false)
        setNextCursor(data.nextCursor || null)
      }
    } catch {
      toast.error('Failed to load older messages')
    } finally {
      setIsLoadingMore(false)
    }
  }, [activityId, nextCursor, isLoadingMore])

  // Initial fetch when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      fetchMessages()
    }
  }, [open, fetchMessages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom()
    }
  }, [isLoading, scrollToBottom, messages.length])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!open || isLocked) return

    const interval = setInterval(() => {
      fetchMessages(true)
    }, 5000)

    return () => clearInterval(interval)
  }, [open, isLocked, fetchMessages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || isReadOnly) return

    const messageText = newMessage.trim()
    setIsSending(true)
    setNewMessage('')

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      isPinned: false,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || '',
        name: user?.fullName || user?.firstName || null,
        imageUrl: user?.imageUrl || null,
      },
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const response = await fetch(`/api/events/${activityId}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const sentMessage = await response.json()
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? sentMessage : m))
      )
    } catch (error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setNewMessage(messageText)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handlePin = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/events/${activityId}/chat/messages/${messageId}/pin`,
        { method: 'PATCH' }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pin message')
      }

      const updated = await response.json()

      // Update in messages list
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: updated.isPinned } : m))
      )

      // Update pinned messages list
      if (updated.isPinned) {
        setPinnedMessages((prev) => [updated, ...prev])
      } else {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId))
      }

      toast.success(updated.isPinned ? 'Message pinned' : 'Message unpinned')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to pin message')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = formatDate(message.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    },
    {} as Record<string, ChatMessage[]>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] sm:h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Group Chat
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </span>
          </DialogTitle>
          {isReadOnly && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
              <Clock className="w-3.5 h-3.5" />
              This chat is now read-only
            </div>
          )}
        </DialogHeader>

        {/* Pinned messages banner */}
        {pinnedMessages.length > 0 && (
          <div className="px-4 sm:px-6 py-2 bg-amber-950 border-b border-amber-100 shrink-0">
            <div className="flex items-start gap-2">
              <Pin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-800">Pinned</p>
                <p className="text-xs text-amber-400 truncate">
                  {pinnedMessages[0].content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Locked state */}
        {isLocked ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center text-muted-foreground">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Chat Locked</p>
              <p className="text-sm mt-1">Join this activity to access the group chat</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
            >
              {/* Load more button */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground mx-auto mb-3" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Be the first to say hello!</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="text-center mb-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {date}
                      </span>
                    </div>
                    {dateMessages.map((message) => {
                      // Icebreaker messages render as a distinct card
                      if (message.isIcebreaker) {
                        return (
                          <div key={message.id} className="flex justify-center mb-3">
                            <div className="bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[75%] text-center">
                              <span className="text-xs font-medium text-amber-400 block mb-1">
                                ✨ Icebreaker
                              </span>
                              <p className="text-sm text-amber-900">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )
                      }

                      // System messages render as centered notifications
                      if (message.isSystem) {
                        return (
                          <div key={message.id} className="flex justify-center mb-3">
                            <div className="flex items-center gap-1.5 px-3 py-1">
                              <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                {message.content}
                              </span>
                            </div>
                          </div>
                        )
                      }

                      const isOwnMessage = user?.id === message.user.id

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-2.5 mb-3 group',
                            isOwnMessage ? 'flex-row-reverse' : ''
                          )}
                        >
                          {/* Avatar */}
                          {message.user.imageUrl ? (
                            <Image
                              src={message.user.imageUrl}
                              alt={message.user.name || 'User'}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium">
                                {message.user.name?.[0] || '?'}
                              </span>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={cn('flex-1 min-w-0', isOwnMessage && 'text-right')}>
                            <div
                              className={cn(
                                'flex items-baseline gap-2 mb-0.5',
                                isOwnMessage ? 'justify-end' : ''
                              )}
                            >
                              <span className="text-xs font-medium">
                                {isOwnMessage ? 'You' : message.user.name || 'Anonymous'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(message.createdAt)}
                              </span>
                              {message.isPinned && (
                                <Pin className="w-3 h-3 text-amber-500 inline-block" />
                              )}
                            </div>
                            <div className="inline-flex items-end gap-1">
                              <div
                                className={cn(
                                  'inline-block rounded-2xl px-3.5 py-2 max-w-[85%] sm:max-w-[75%]',
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-muted rounded-bl-sm'
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              {/* Pin button for host */}
                              {isHost && !message.id.startsWith('temp-') && (
                                <button
                                  onClick={() => handlePin(message.id)}
                                  className={cn(
                                    'p-1 rounded transition-opacity',
                                    message.isPinned
                                      ? 'text-amber-500 opacity-100'
                                      : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                                  )}
                                  title={message.isPinned ? 'Unpin message' : 'Pin message'}
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {isReadOnly ? (
              <div className="px-4 sm:px-6 py-3 border-t bg-muted/50 text-center text-sm text-muted-foreground shrink-0">
                <Clock className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                This chat is read-only
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-3 border-t flex gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <Button
                  onClick={handleSend}
                  disabled={isSending || !newMessage.trim()}
                  size="icon"
                  className="rounded-full shrink-0 h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
