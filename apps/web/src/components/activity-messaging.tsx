'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
}

interface Conversation {
  id: string
  activityId: string
  sender: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  receiver: {
    id: string
    name: string | null
    imageUrl: string | null
  }
}

interface ActivityMessagingProps {
  activityId: string
  hostName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityMessaging({
  activityId,
  hostName,
  open,
  onOpenChange,
}: ActivityMessagingProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) {
      fetchMessages()
    }
  }, [open, activityId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/messages`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data.messages || [])
      setConversation(data.conversation)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const sentMessage = await response.json()
      setMessages([...messages, sentMessage])
      setNewMessage('')

      if (!conversation) {
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const getOtherPerson = () => {
    if (!conversation || !user) return hostName || 'Host'
    const otherPerson =
      conversation.sender.id === user.id
        ? conversation.receiver
        : conversation.sender
    return otherPerson.name || 'User'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Message {getOtherPerson()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.user.id === user?.id
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="flex-shrink-0">
                    {message.user.imageUrl ? (
                      <img
                        src={message.user.imageUrl}
                        alt={message.user.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        {message.user.name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex flex-col gap-1 max-w-[70%] ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
