'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Users } from 'lucide-react'
import { toast } from 'sonner'

interface GroupMessage {
  id: string
  content: string
  createdAt: Date
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
  const [messages, setMessages] = useState<GroupMessage[]>([])
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
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/group/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else if (response.status === 403) {
        toast.error('You must join this activity to view the group chat')
      }
    } catch (error) {
      console.error('Error fetching group messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (open) {
      fetchMessages()
    }
  }, [open, activityId])

  // Poll for new messages every 3 seconds when dialog is open
  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [open, activityId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
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
      console.error('Error sending message:', error)
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
            Chat with all activity participants
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
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 mb-4 ${
                        isOwnMessage ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {message.user.imageUrl ? (
                        <img
                          src={message.user.imageUrl}
                          alt={message.user.name || 'User'}
                          className="w-8 h-8 rounded-full flex-shrink-0"
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
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
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

        <form
          onSubmit={handleSend}
          className="px-6 py-4 border-t flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
