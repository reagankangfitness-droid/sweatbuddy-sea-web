'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import {
  Instagram,
  MessageCircle,
  Mail,
  FileText,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Clock,
  ChevronDown,
  RefreshCw,
  History,
} from 'lucide-react'

type ContentType = 'instagram_caption' | 'whatsapp_message' | 'event_description' | 'email'
type ContentTone = 'casual' | 'professional' | 'excited' | 'motivational'
type ContentLength = 'short' | 'medium' | 'long'

interface GeneratedContent {
  id: string
  content: string
  type: ContentType
  tone: ContentTone
  length: ContentLength
  metadata?: { hashtags?: string[]; subject?: string }
  eventId?: string | null
  copiedAt?: string | null
  createdAt: string
}

interface Event {
  id: string
  name: string
  date: string | null
  day: string
  time: string
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'instagram_caption', label: 'Instagram', icon: <Instagram className="w-5 h-5" />, description: 'Engaging captions with hashtags' },
  { id: 'whatsapp_message', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, description: 'Quick messages to share' },
  { id: 'event_description', label: 'Event', icon: <FileText className="w-5 h-5" />, description: 'Clear event descriptions' },
  { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" />, description: 'Professional email messages' },
]

const TONES: { id: ContentTone; label: string; emoji: string }[] = [
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'excited', label: 'Excited', emoji: '🎉' },
  { id: 'motivational', label: 'Motivational', emoji: '💪' },
]

const LENGTHS: { id: ContentLength; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
]

function ContentSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-72 mb-8" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            ))}
          </div>

          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        </div>
      </main>
    </div>
  )
}

export default function ContentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState<ContentType>('instagram_caption')
  const [selectedTone, setSelectedTone] = useState<ContentTone>('casual')
  const [selectedLength, setSelectedLength] = useState<ContentLength>('medium')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/sign-in?intent=host')
          return
        }

        // Fetch events and content history in parallel
        const [eventsRes, historyRes] = await Promise.all([
          fetch('/api/host/dashboard'),
          fetch('/api/host/content?limit=10'),
        ])

        if (eventsRes.ok) {
          const data = await eventsRes.json()
          setEvents([...data.upcoming, ...data.past].slice(0, 10))
        }

        if (historyRes.ok) {
          const data = await historyRes.json()
          setContentHistory(data.contents)
        }
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [router])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setCopied(false)

    try {
      const res = await fetch('/api/host/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          tone: selectedTone,
          length: selectedLength,
          eventId: selectedEvent || undefined,
          customPrompt: customPrompt.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedContent(data)
        setContentHistory(prev => [data, ...prev].slice(0, 10))
      } else if (res.status === 429) {
        setError('Rate limit reached. Please wait before generating more content.')
      } else {
        throw new Error('Failed to generate')
      }
    } catch {
      setError('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedContent) return

    try {
      await navigator.clipboard.writeText(generatedContent.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // Track copy
      await fetch('/api/host/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: generatedContent.id, action: 'copy' }),
      })
    } catch {
      // Fallback for browsers that don't support clipboard
      const textarea = document.createElement('textarea')
      textarea.value = generatedContent.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadFromHistory = (content: GeneratedContent) => {
    setGeneratedContent(content)
    setSelectedType(content.type)
    setSelectedTone(content.tone)
    setSelectedLength(content.length)
    setShowHistory(false)
  }

  if (isLoading) {
    return <ContentSkeleton />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              Content Generator
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Create engaging content for your community with AI
            </p>
          </div>
          {contentHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
          )}
        </div>

        {/* History Panel */}
        {showHistory && contentHistory.length > 0 && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Recent Content</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contentHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="w-full text-left p-3 bg-white dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                    {item.content}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            What do you want to create?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedType === type.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className={`mb-2 ${selectedType === type.id ? 'text-violet-600 dark:text-violet-400' : 'text-neutral-400'}`}>
                  {type.icon}
                </div>
                <p className={`font-medium text-sm ${selectedType === type.id ? 'text-violet-900 dark:text-violet-100' : 'text-neutral-900 dark:text-white'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone & Length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTone === tone.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {tone.emoji} {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Length
            </label>
            <div className="flex gap-2">
              {LENGTHS.map((len) => (
                <button
                  key={len.id}
                  onClick={() => setSelectedLength(len.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedLength === len.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {len.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Selection (Optional) */}
        {events.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              For a specific event? (optional)
            </label>
            <div className="relative">
              <select
                value={selectedEvent || ''}
                onChange={(e) => setSelectedEvent(e.target.value || null)}
                className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl text-sm text-neutral-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">No specific event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {event.day} {event.time}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Additional context (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., Mention we're celebrating our 1-year anniversary, or highlight the new location..."
            rows={2}
            className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder:text-neutral-400"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Content
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && (
          <div className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Generated Content</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">
                {generatedContent.content}
              </p>
            </div>

            {generatedContent.metadata?.hashtags && generatedContent.metadata.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {generatedContent.metadata.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs text-violet-600 dark:text-violet-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(generatedContent.createdAt).toLocaleString()}
              </span>
              <span className="capitalize">{generatedContent.tone}</span>
              <span className="capitalize">{generatedContent.length}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
