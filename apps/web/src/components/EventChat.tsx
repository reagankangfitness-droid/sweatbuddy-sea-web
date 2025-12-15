'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Loader2 } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  senderName: string
  senderEmail: string
  createdAt: string
}

interface EventChatProps {
  eventId: string
  eventName: string
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
}

export function EventChat({ eventId, eventName, isOpen, onClose, userEmail: propEmail, userName: propName }: EventChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState(propEmail || '')
  const [userName, setUserName] = useState(propName || '')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update from props when they change
  useEffect(() => {
    if (propEmail) setUserEmail(propEmail)
    if (propName) setUserName(propName)
  }, [propEmail, propName])

  // Fallback to localStorage if props not provided
  useEffect(() => {
    if (typeof window !== 'undefined' && !propEmail) {
      const saved = localStorage.getItem('sweatbuddies_user')
      if (saved) {
        try {
          const { email, name } = JSON.parse(saved)
          if (!userEmail && email) setUserEmail(email)
          if (!userName && name) setUserName(name)
        } catch {
          // Ignore
        }
      }
    }
  }, [propEmail, userEmail, userName])

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    if (isOpen) {
      fetchMessages()

      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, eventId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userEmail || isSending) return

    setIsSending(true)
    setError('')

    try {
      const response = await fetch(`/api/events/${eventId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderName: userName || 'Anonymous',
          senderEmail: userEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      setNewMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate consistent color from email
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-red-500',
    ]
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[80vh] sm:h-[70vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Group Chat</h3>
                <p className="text-xs text-white/80 truncate max-w-[200px]">{eventName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-gray-400">Be the first to say hi!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.senderEmail === userEmail
                  const showDate = index === 0 ||
                    formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt)

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.senderEmail)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                            {getInitials(msg.senderName)}
                          </div>
                        )}
                        <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          {!isOwnMessage && (
                            <p className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-[#2563EB] text-white rounded-br-md'
                                : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className={`text-[10px] text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t bg-white">
            {error && (
              <p className="text-red-500 text-xs mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="p-2.5 bg-[#2563EB] text-white rounded-full hover:bg-[#1d4ed8] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
