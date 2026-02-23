'use client'

import { useState } from 'react'
import { X, Sparkles, Camera, RefreshCw, Send, Check, Loader2 } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import Image from 'next/image'

interface RecapCreatorProps {
  eventId: string
  eventName: string
  category: string
  attendeeCount: number
  onClose: () => void
  onPublished: () => void
}

type Step = 'form' | 'preview' | 'published'

export function RecapCreator({
  eventId,
  eventName,
  category,
  attendeeCount,
  onClose,
  onPublished,
}: RecapCreatorProps) {
  const [step, setStep] = useState<Step>('form')
  const [hostNotes, setHostNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [recapText, setRecapText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: eventName,
          category,
          attendeeCount,
          hostNotes: hostNotes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate recap')
        return
      }

      setRecapText(data.recap)
      setRemaining(data.remaining)
      setStep('preview')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/host/events/${eventId}/recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recapText,
          photoUrl,
          hostNotes: hostNotes || undefined,
          attendeeCount,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to publish recap')
        return
      }

      setStep('published')
      onPublished()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {step === 'published' ? 'Recap Published!' : 'Create Event Recap'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Event Info */}
          {step !== 'published' && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
              <p className="font-medium text-neutral-900 dark:text-white text-sm">{eventName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'} · {category}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Form */}
          {step === 'form' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  How did it go? <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={hostNotes}
                  onChange={(e) => setHostNotes(e.target.value)}
                  placeholder="e.g. Great energy today! We tried a new format and everyone loved it..."
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Add a photo <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                {photoUrl ? (
                  <div className="relative">
                    <Image
                      src={photoUrl}
                      alt="Recap photo"
                      width={480}
                      height={320}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    endpoint="recapImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setPhotoUrl(res[0].serverData.url)
                      }
                    }}
                    onUploadError={(err) => {
                      setError(`Upload failed: ${err.message}`)
                    }}
                    appearance={{
                      button: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-sm font-medium px-4 py-2.5 ut-uploading:bg-neutral-200',
                      allowedContent: 'text-xs text-neutral-400',
                    }}
                    content={{
                      button({ isUploading }) {
                        return isUploading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Upload Photo</span>
                        )
                      },
                    }}
                  />
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Recap</>
                )}
              </button>
            </>
          )}

          {/* Step 2: Preview + Publish */}
          {step === 'preview' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Recap text
                </label>
                <textarea
                  value={recapText}
                  onChange={(e) => setRecapText(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                  rows={4}
                />
              </div>

              {photoUrl && (
                <div className="relative">
                  <Image
                    src={photoUrl}
                    alt="Recap photo"
                    width={480}
                    height={320}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              {remaining !== null && (
                <p className="text-xs text-neutral-400 text-center">
                  {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Regenerate</>
                  )}
                </button>

                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !recapText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Publish Recap</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Published state */}
          {step === 'published' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Recap published!
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Attendees have been notified via email.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
