'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Copy, Check, Loader2, RefreshCcw, Instagram, MessageCircle, Type } from 'lucide-react'

type Tab = 'instagram' | 'whatsapp' | 'story'

interface SocialContent {
  instagram: string
  whatsapp: string
  story: string
}

interface SocialPostGeneratorProps {
  eventId: string
  eventName: string
  category: string
  location: string
  date: string | null
  time: string | null
  description: string | null
  onClose: () => void
}

export function SocialPostGenerator({
  eventName,
  category,
  location,
  date,
  time,
  description,
  onClose,
}: SocialPostGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState<SocialContent | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('instagram')
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError('')

    try {
      const dateTime = [date, time].filter(Boolean).join(' at ')
      const res = await fetch('/api/ai/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: eventName,
          category,
          location,
          dateTime: dateTime || undefined,
          description: description || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setContent({ instagram: data.instagram, whatsapp: data.whatsapp, story: data.story })
      setRemaining(data.remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }, [eventName, category, location, date, time, description])

  useEffect(() => {
    generate()
  }, [generate])

  const handleCopy = async (tab: Tab) => {
    if (!content) return
    const text = content[tab]
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'story', label: 'Story', icon: <Type className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-neutral-950 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-bold text-neutral-100">Social Media Content</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-3 border-b border-neutral-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {isGenerating ? (
            <div className="space-y-3">
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-full" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-4/5" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-1/2" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={generate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : content ? (
            <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {content[activeTab]}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-800 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            {remaining !== null && (
              <span className="text-xs text-neutral-400">{remaining} left today</span>
            )}
          </div>

          {content && (
            <button
              onClick={() => handleCopy(activeTab)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              {copiedTab === activeTab ? (
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
          )}
        </div>
      </div>
    </div>
  )
}
