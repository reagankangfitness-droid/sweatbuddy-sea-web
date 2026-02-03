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
import { Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { MentionInput } from '@/components/mention-input'
import { renderMentionedContent, type MentionableUser } from '@/lib/mentions'
import { cn } from '@/lib/utils'

interface GroupMessage {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  mentions?: Array<{
    id: string
    mentionedUserId: string
    mentionText: string
  }>
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
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/group/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setMentionableUsers(data.mentionableUsers || [])
      } else if (response.status === 403) {
        toast.error('You must join this activity to view the group chat')
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false)
    }
  }, [activityId])

  // Initial fetch
  useEffect(() => {
    if (open) {
      fetchMessages()
    }
  }, [open, activityId, fetchMessages])

  // Poll for new messages every 3 seconds when dialog is open
  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [open, activityId, fetchMessages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/group/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const sentMessage = await response.json()
      setMessages([...messages, sentMessage])
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    const messageDate = new Date(date)
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

  // Render message content with highlighted mentions
  const renderMessageContent = (content: string, isOwnMessage: boolean) => {
    const segments = renderMentionedContent(content, mentionableUsers)

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {segments.map((segment, index) => {
          if (segment.isMention) {
            const isMentioningCurrentUser = segment.userId === user?.id
            return (
              <span
                key={index}
                className={cn(
                  'font-semibold rounded px-0.5',
                  isOwnMessage
                    ? 'text-primary-foreground/90 bg-primary-foreground/20'
                    : isMentioningCurrentUser
                    ? 'text-primary bg-primary/20'
                    : 'text-primary'
                )}
              >
                {segment.text}
              </span>
            )
          }
          return <span key={index}>{segment.text}</span>
        })}
      </p>
    )
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, GroupMessage[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Chat
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Chat with all activity participants. Use @ to mention someone.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to say hello!</p>
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
                  const isOwnMessage = user?.id === message.user.id
                  const hasMentionOfCurrentUser = message.mentions?.some(
                    m => m.mentionedUserId === user?.id
                  )

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3 mb-4',
                        isOwnMessage ? 'flex-row-reverse' : '',
                        hasMentionOfCurrentUser && !isOwnMessage && 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg'
                      )}
                    >
                      {message.user.imageUrl ? (
                        <Image
                          src={message.user.imageUrl}
                          alt={message.user.name || 'User'}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">
                            {message.user.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex-1 ${
                          isOwnMessage ? 'text-right' : ''
                        }`}
                      >
                        <div className={`flex items-baseline gap-2 mb-1 ${
                          isOwnMessage ? 'justify-end' : ''
                        }`}>
                          <span className="text-sm font-medium">
                            {isOwnMessage ? 'You' : message.user.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {renderMessageContent(message.content, isOwnMessage)}
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

        <div className="px-6 py-4 border-t flex gap-2">
          <MentionInput
            value={newMessage}
            onChange={setNewMessage}
            onSubmit={handleSend}
            mentionableUsers={mentionableUsers}
            disabled={isSending}
            placeholder="Type your message... Use @ to mention someone"
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
