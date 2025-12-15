'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Loader2,
  Send,
  X,
  Mail,
  Calendar,
  Clock,
  Download,
  Copy,
  Check,
  Edit3
} from 'lucide-react'

interface Attendee {
  id: string
  email: string
  name: string | null
  timestamp: string
  mealPreference: string | null
  hasConversation: boolean
  lastMessageAt: string | null
}

interface Message {
  id: string
  content: string
  senderType: 'organizer' | 'attendee'
  senderName: string
  createdAt: string
}

interface Organizer {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

export default function OrganizerEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Chat state
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Export state
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }
        const sessionData = await sessionRes.json()
        setOrganizer(sessionData.organizer)

        // Get attendees
        const attendeesRes = await fetch(`/api/organizer/events/${eventId}/attendees`)
        if (attendeesRes.ok) {
          const attendeesData = await attendeesRes.json()
          setAttendees(attendeesData.attendees)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [eventId, router])

  // Fetch messages when attendee is selected
  useEffect(() => {
    if (!selectedAttendee) return

    const fetchMessages = async () => {
      setIsChatLoading(true)
      try {
        const res = await fetch(
          `/api/events/${eventId}/dm?email=${encodeURIComponent(selectedAttendee.email)}`
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      } finally {
        setIsChatLoading(false)
      }
    }

    fetchMessages()

    // Poll for new messages
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedAttendee, eventId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedAttendee || isSending) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderEmail: selectedAttendee.email, // Target attendee
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Export functions
  const handleCopyEmails = async () => {
    const emails = attendees.map(a => a.email).join(', ')
    await navigator.clipboard.writeText(emails)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCSV = () => {
    const headers = ['Name', 'Email', 'Signed Up', 'Meal Preference']
    const rows = attendees.map(a => [
      a.name || '',
      a.email,
      new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      a.mealPreference || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${eventId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#3477f8]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/organizer/dashboard"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">Event Attendees</h1>
            <p className="text-sm text-gray-500">{attendees.length} people going</p>
          </div>
          <Link
            href={`/organizer/dashboard/${eventId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium text-sm"
          >
            <Edit3 className="w-4 h-4" />
            Edit Event
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Attendees List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3477f8]" />
                  Attendees
                </h2>
                {attendees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyEmails}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Emails</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3477f8] hover:bg-[#2563eb] rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {attendees.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No attendees yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {attendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3477f8] to-[#2563eb] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {attendee.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {attendee.email}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Signed up {formatDate(attendee.timestamp)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedAttendee(attendee)}
                        className={`p-2 rounded-lg transition flex items-center gap-2 ${
                          selectedAttendee?.id === attendee.id
                            ? 'bg-[#3477f8] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">Chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 sticky top-24 overflow-hidden">
              {selectedAttendee ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#3477f8] to-[#2563eb] text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                        {(selectedAttendee.name || selectedAttendee.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {selectedAttendee.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-white/70">{selectedAttendee.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAttendee(null)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {isChatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs text-gray-400">Send the first message!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => {
                          const isOrganizer = msg.senderType === 'organizer'
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOrganizer ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                                  isOrganizer
                                    ? 'bg-[#3477f8] text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <p
                                  className={`text-[10px] mt-1 ${
                                    isOrganizer ? 'text-white/60' : 'text-gray-400'
                                  }`}
                                >
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        maxLength={500}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-[#3477f8] focus:border-transparent outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 bg-[#3477f8] text-white rounded-full hover:bg-[#3477f8]/90 transition disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Direct Messages</h3>
                  <p className="text-sm text-gray-500">
                    Select an attendee to start chatting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
