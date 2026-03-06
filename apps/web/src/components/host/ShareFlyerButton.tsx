'use client'

import { useState, useCallback } from 'react'
import { Image, Download, Loader2, X, Smartphone, Square } from 'lucide-react'
import { toast } from 'sonner'

interface ShareFlyerButtonProps {
  event: {
    id: string
    name: string
    day: string
    time: string
    location: string
    category: string
    organizer?: string | null
  }
  compact?: boolean
}

export function ShareFlyerButton({ event, compact = false }: ShareFlyerButtonProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [format, setFormat] = useState<'story' | 'post' | null>(null)

  const getCategoryInfo = useCallback(async () => {
    // Dynamic import to avoid pulling the full categories module into the client bundle
    const { getCategoryEmoji, getCategoryColor, getCategoryDisplay } = await import('@/lib/categories')
    const display = getCategoryDisplay(event.category)
    return {
      emoji: getCategoryEmoji(event.category),
      color: getCategoryColor(event.category),
      name: display.name,
    }
  }, [event.category])

  const generateAndShare = useCallback(
    async (selectedFormat: 'story' | 'post') => {
      setFormat(selectedFormat)
      setIsGenerating(true)

      try {
        const catInfo = await getCategoryInfo()

        const params = new URLSearchParams({
          title: event.name,
          day: event.day,
          time: event.time,
          location: event.location,
          host: event.organizer || '',
          category: catInfo.name,
          color: catInfo.color,
          emoji: catInfo.emoji,
          format: selectedFormat,
        })

        const res = await fetch(`/api/og/flyer?${params}`)
        if (!res.ok) throw new Error('Failed to generate flyer')

        const blob = await res.blob()
        const fileName = `${event.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${selectedFormat}.png`

        // Try native share on mobile (with file support)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], fileName, { type: 'image/png' })
          const shareData = { files: [file] }

          if (navigator.canShare(shareData)) {
            try {
              await navigator.share(shareData)
              setShowPicker(false)
              return
            } catch {
              // User cancelled or share failed — fall through to download
            }
          }
        }

        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setShowPicker(false)
      } catch (err) {
        console.error('Flyer generation failed:', err)
        toast.error('Failed to generate flyer. Please try again.')
      } finally {
        setIsGenerating(false)
        setFormat(null)
      }
    },
    [event, getCategoryInfo]
  )

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowPicker(true)}
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          title="Share flyer"
        >
          <Image className="w-4 h-4 text-neutral-400" />
        </button>

        {showPicker && (
          <FormatPicker
            isGenerating={isGenerating}
            activeFormat={format}
            onSelect={generateAndShare}
            onClose={() => !isGenerating && setShowPicker(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <Image className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Share Flyer</span>
        <span className="sm:hidden">Flyer</span>
      </button>

      {showPicker && (
        <FormatPicker
          isGenerating={isGenerating}
          activeFormat={format}
          onSelect={generateAndShare}
          onClose={() => !isGenerating && setShowPicker(false)}
        />
      )}
    </>
  )
}

function FormatPicker({
  isGenerating,
  activeFormat,
  onSelect,
  onClose,
}: {
  isGenerating: boolean
  activeFormat: 'story' | 'post' | null
  onSelect: (format: 'story' | 'post') => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xs bg-neutral-950 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="font-semibold text-neutral-100 text-base">
            Share Flyer
          </h3>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 text-neutral-400 hover:text-neutral-400 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-neutral-500">
            Choose a format to download or share.
          </p>

          {/* Story format */}
          <button
            onClick={() => onSelect('story')}
            disabled={isGenerating}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-14 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-800">
              <Smartphone className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral-100">
                Instagram Story
              </p>
              <p className="text-xs text-neutral-500">
                1080 x 1920 · 9:16
              </p>
            </div>
            {isGenerating && activeFormat === 'story' && (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400 flex-shrink-0" />
            )}
            {(!isGenerating || activeFormat !== 'story') && (
              <Download className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            )}
          </button>

          {/* Post format */}
          <button
            onClick={() => onSelect('post')}
            disabled={isGenerating}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-800">
              <Square className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral-100">
                Instagram Post
              </p>
              <p className="text-xs text-neutral-500">
                1080 x 1080 · 1:1
              </p>
            </div>
            {isGenerating && activeFormat === 'post' && (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400 flex-shrink-0" />
            )}
            {(!isGenerating || activeFormat !== 'post') && (
              <Download className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
