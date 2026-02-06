'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Send, X, Trash2, Loader2 } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export function AgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load conversation when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      loadConversation()
    }
  }, [isOpen])

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadConversation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/host/chat')
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        setMessages(data.messages)
      } else {
        throw new Error('Failed to load chat')
      }
    } catch {
      setError('Failed to load chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage = input.trim()
    setInput('')
    setIsSending(true)
    setError(null)

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
        // Replace temp message with actual and add assistant response
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ])
      } else if (res.status === 429) {
        const data = await res.json()
        setError(data.error || 'Rate limit reached. Please wait.')
        // Remove optimistic message
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
                  <MessageSquare className="w-4 h-4" />
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
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm font-medium mb-1">Hi there!</p>
                <p className="text-xs">Ask me about your events, community insights, or content ideas.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
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
                onClick={sendMessage}
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
