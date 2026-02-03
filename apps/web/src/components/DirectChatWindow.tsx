'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Loader2, Mail, CheckCircle, Instagram } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderType: 'organizer' | 'attendee'
  senderName: string
  createdAt: string
}

interface DirectChatWindowProps {
  eventId: string
  eventName: string
  organizerHandle: string
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
}

export function DirectChatWindow({
  eventId,
  eventName,
  organizerHandle,
  isOpen,
  onClose,
  userEmail: propEmail,
  userName: propName,
}: DirectChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState(propEmail || '')
  const [userName, setUserName] = useState(propName || '')
  const [organizerRegistered, setOrganizerRegistered] = useState(true)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquirySent, setInquirySent] = useState(false)
  const [isSendingInquiry, setIsSendingInquiry] = useState(false)
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
  const fetchMessages = useCallback(async () => {
    if (!userEmail) {
      setError('RSVP to this event first to chat with the host')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/dm?email=${encodeURIComponent(userEmail)}`
      )
      const data = await response.json()

      if (!response.ok) {
        // Handle "not an attendee" error
        if (response.status === 403) {
          setError(data.error || 'Only attendees can message the organizer')
        }
        return
      }

      setOrganizerRegistered(data.organizerRegistered)
      setMessages(data.messages || [])
      setError('') // Clear any previous errors
    } catch {
      setError('Couldn\'t load messages. Try again?')
    } finally {
      setIsLoading(false)
    }
  }, [eventId, userEmail])

  // Initial fetch and polling
  useEffect(() => {
    if (isOpen && userEmail) {
      fetchMessages()

      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, eventId, userEmail, fetchMessages])

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
      const response = await fetch(`/api/events/${eventId}/dm`, {
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
      hour12: true,
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

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inquiryMessage.trim() || !userEmail || isSendingInquiry) return

    setIsSendingInquiry(true)
    setError('')

    try {
      const response = await fetch(`/api/events/${eventId}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inquiryMessage.trim(),
          senderName: userName || 'Anonymous',
          senderEmail: userEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send')
      }

      setInquirySent(true)
      setInquiryMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSendingInquiry(false)
    }
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
          className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[80vh] sm:h-[70vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#1800ad] to-[#3477f8] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Chat with Organizer</h3>
                <p className="text-xs text-white/80">@{organizerHandle}</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : error && error.includes('attendee') ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 px-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-red-300" />
                </div>
                <p className="text-center text-sm text-red-600 mb-2">
                  {error}
                </p>
                <p className="text-xs text-neutral-400 text-center">
                  Click &quot;I&apos;m Going&quot; first to chat with the organizer
                </p>
              </div>
            ) : !organizerRegistered ? (
              <div className="flex flex-col h-full">
                {inquirySent ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400 px-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-center text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                      Message sent!
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                      The host will receive your inquiry and can reply via email or on SweatBuddies.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full px-4 py-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                        Send a message to @{organizerHandle}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Your inquiry will be sent directly to the host
                      </p>
                    </div>
                    <form onSubmit={handleSendInquiry} className="flex flex-col flex-1">
                      <textarea
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Hi! I have a question about this event..."
                        maxLength={500}
                        rows={5}
                        className="flex-1 min-h-[120px] px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1800ad] focus:border-transparent outline-none text-sm placeholder:text-neutral-400 resize-none"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-neutral-400">
                          {inquiryMessage.length}/500
                        </span>
                        <button
                          type="submit"
                          disabled={!inquiryMessage.trim() || isSendingInquiry}
                          className="px-5 py-2.5 bg-[#1800ad] text-white rounded-full hover:bg-[#1800ad]/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                        >
                          {isSendingInquiry ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </button>
                      </div>
                      {error && (
                        <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
                <MessageCircle className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Send a message to @{organizerHandle}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.senderType === 'attendee'
                  const showDate =
                    index === 0 ||
                    formatDate(messages[index - 1].createdAt) !==
                      formatDate(msg.createdAt)

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 px-3 py-1 rounded-full shadow-sm">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex gap-2 ${
                          isOwnMessage ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1800ad] to-[#3477f8] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {organizerHandle.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs text-neutral-500 mb-1 ml-1">
                              @{organizerHandle}
                            </p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-[#1800ad] text-white rounded-br-md'
                                : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white shadow-sm rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                          <p
                            className={`text-[10px] text-neutral-400 mt-1 ${
                              isOwnMessage ? 'text-right mr-1' : 'ml-1'
                            }`}
                          >
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

          {/* Input - hide when user is not an attendee */}
          {organizerRegistered && !(error && error.includes('attendee')) && (
            <form onSubmit={handleSend} className="p-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900">
              {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full focus:ring-2 focus:ring-[#1800ad] focus:border-transparent outline-none text-sm placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-2.5 bg-[#1800ad] text-white rounded-full hover:bg-[#1800ad]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
