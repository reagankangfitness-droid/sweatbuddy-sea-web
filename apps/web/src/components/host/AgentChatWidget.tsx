'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Send, X, Trash2, Loader2, Sparkles } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  isTyping?: boolean
}

interface QuickQuestion {
  label: string
  question: string
  icon?: string
}

// Category-specific quick questions
const QUICK_QUESTIONS: Record<string, QuickQuestion[]> = {
  RUN: [
    { label: 'Grow my run club', question: 'How can I grow my running community in Singapore?', icon: '📈' },
    { label: 'Engage regulars', question: 'How do I keep my regular runners engaged and coming back?', icon: '⭐' },
    { label: 'Route ideas', question: 'Can you suggest some interesting running routes in Singapore?', icon: '🗺️' },
    { label: 'Rainy day plan', question: 'What should I do when it rains and we can\'t run outdoors?', icon: '🌧️' },
  ],
  YOGA: [
    { label: 'Grow my community', question: 'How can I attract more people to my yoga sessions?', icon: '📈' },
    { label: 'Beginner tips', question: 'How do I make beginners feel welcome in my yoga classes?', icon: '🌱' },
    { label: 'Session themes', question: 'What are some creative themes for yoga sessions?', icon: '✨' },
    { label: 'Outdoor yoga', question: 'What are the best spots for outdoor yoga in Singapore?', icon: '🌳' },
  ],
  HIIT: [
    { label: 'Grow attendance', question: 'How can I get more people to join my HIIT sessions?', icon: '📈' },
    { label: 'Scale workouts', question: 'How do I scale workouts for different fitness levels?', icon: '💪' },
    { label: 'Keep it fresh', question: 'How do I keep my HIIT workouts interesting week after week?', icon: '🔥' },
    { label: 'Equipment ideas', question: 'What minimal equipment should I bring for outdoor HIIT?', icon: '🎒' },
  ],
  MEDITATION: [
    { label: 'Attract members', question: 'How can I attract more people to try meditation?', icon: '📈' },
    { label: 'Quiet locations', question: 'Where are the best quiet spots for meditation in Singapore?', icon: '🧘' },
    { label: 'Session ideas', question: 'What types of meditation sessions work well for beginners?', icon: '🌱' },
    { label: 'Build consistency', question: 'How do I help my community build a consistent practice?', icon: '📅' },
  ],
  BOOTCAMP: [
    { label: 'Grow bootcamp', question: 'How can I grow my bootcamp attendance?', icon: '📈' },
    { label: 'Team activities', question: 'What are some fun team-based bootcamp activities?', icon: '👥' },
    { label: 'Weather backup', question: 'What\'s a good backup plan when weather is bad?', icon: '🌧️' },
    { label: 'Member retention', question: 'How do I keep bootcamp members motivated long-term?', icon: '💪' },
  ],
  STRENGTH: [
    { label: 'Grow community', question: 'How can I attract more people to strength training?', icon: '📈' },
    { label: 'Programming tips', question: 'How should I structure progressive strength programs?', icon: '📊' },
    { label: 'Form coaching', question: 'How do I effectively teach proper lifting form in groups?', icon: '🎯' },
    { label: 'Track progress', question: 'What\'s the best way to track member progress?', icon: '📈' },
  ],
  OTHER: [
    { label: 'Grow community', question: 'How can I grow my fitness community?', icon: '📈' },
    { label: 'Engage members', question: 'How do I keep my community members engaged?', icon: '⭐' },
    { label: 'Content ideas', question: 'What content should I post on social media?', icon: '📱' },
    { label: 'Re-engage members', question: 'How do I bring back members who stopped coming?', icon: '🔄' },
  ],
  DEFAULT: [
    { label: 'Grow community', question: 'How can I grow my fitness community?', icon: '📈' },
    { label: 'This week\'s tips', question: 'Based on my data, what should I focus on this week?', icon: '🎯' },
    { label: 'Content ideas', question: 'Can you help me write an Instagram post for my next event?', icon: '📱' },
    { label: 'Re-engage members', question: 'How do I bring back members who haven\'t attended recently?', icon: '🔄' },
  ],
}

// Typing animation hook
function useTypingAnimation(text: string, isTyping: boolean, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text)
      setIsComplete(true)
      return
    }

    setDisplayedText('')
    setIsComplete(false)
    let index = 0

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, isTyping, speed])

  return { displayedText, isComplete }
}

// Message component with typing animation
function AnimatedMessage({ message }: { message: ChatMessage }) {
  const { displayedText, isComplete } = useTypingAnimation(
    message.content,
    message.isTyping || false,
    15
  )

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
          message.role === 'user'
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">
          {displayedText}
          {message.isTyping && !isComplete && (
            <span className="inline-block w-1 h-4 ml-0.5 bg-violet-600 dark:bg-violet-400 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  )
}

export function AgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [communityType, setCommunityType] = useState<string | null>(null)
  const [showQuickQuestions, setShowQuickQuestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load conversation and community type when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      loadConversation()
      loadCommunityType()
    }
  }, [isOpen])

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadCommunityType = async () => {
    try {
      const res = await fetch('/api/host/onboarding')
      if (res.ok) {
        const data = await res.json()
        setCommunityType(data.organizer?.communityType || null)
      }
    } catch {
      // Silently fail - will use default questions
    }
  }

  const loadConversation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/host/chat')
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        setMessages(data.messages)
        // Hide quick questions if there are already messages
        if (data.messages.length > 0) {
          setShowQuickQuestions(false)
        }
      } else {
        throw new Error('Failed to load chat')
      }
    } catch {
      setError('Failed to load chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim()
    if (!userMessage || isSending) return

    setInput('')
    setIsSending(true)
    setError(null)
    setShowQuickQuestions(false)

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/host/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        // Replace temp message with actual and add assistant response with typing animation
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          { ...data.assistantMessage, isTyping: true },
        ])
        // Remove typing flag after animation completes
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.assistantMessage.id ? { ...m, isTyping: false } : m
            )
          )
        }, data.assistantMessage.content.length * 15 + 500)
      } else if (res.status === 429) {
        const data = await res.json()
        setError(data.error || 'Rate limit reached. Please wait.')
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
      } else {
        throw new Error('Failed to send message')
      }
    } catch {
      setError('Failed to send message. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
    } finally {
      setIsSending(false)
    }
  }

  const clearConversation = async () => {
    if (!conversationId) return

    try {
      const res = await fetch(`/api/host/chat?conversationId=${conversationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        setMessages([])
        setShowQuickQuestions(true)
      }
    } catch {
      setError('Failed to clear conversation.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  // Get quick questions based on community type
  const quickQuestions = QUICK_QUESTIONS[communityType || 'DEFAULT'] || QUICK_QUESTIONS.DEFAULT

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Chat widget */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[70vh] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">AI Assistant</h3>
                  <p className="text-xs text-white/80">Ask me anything about your community</p>
                </div>
              </div>
              <button
                onClick={clearConversation}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  Hey! How can I help?
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Ask me about your events, community insights, or content ideas.
                </p>

                {/* Quick questions */}
                {showQuickQuestions && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                      Quick questions
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickQuestion(q.question)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-neutral-700 dark:text-neutral-300 hover:text-violet-700 dark:hover:text-violet-300 rounded-full text-xs font-medium transition-colors"
                        >
                          <span>{q.icon}</span>
                          <span>{q.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <AnimatedMessage key={msg.id} message={msg} />
                ))}
              </>
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions when messages exist */}
          {messages.length > 0 && !isSending && (
            <div className="px-3 pb-2 overflow-x-auto">
              <div className="flex gap-2">
                {quickQuestions.slice(0, 2).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q.question)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <span>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your community..."
                rows={1}
                className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder:text-neutral-500"
                style={{ maxHeight: '100px' }}
                disabled={isSending}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSending}
                className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
