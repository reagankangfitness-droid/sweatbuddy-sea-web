'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface SaveEventButtonProps {
  eventId: string
  eventSlug?: string
  className?: string
  iconOnly?: boolean
}

export function SaveEventButton({ eventId, eventSlug, className = '', iconOnly = false }: SaveEventButtonProps) {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
    setIsSaved(saved.includes(eventId))
  }, [eventId])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Prompt login if not signed in
    if (isLoaded && !isSignedIn) {
      toast('Sign in to save events', {
        description: 'Create an account to save events and access them anywhere.',
        action: {
          label: 'Sign in',
          onClick: () => router.push(`/sign-in?redirect_url=/e/${eventSlug || eventId}`),
        },
      })
      return
    }

    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])

    let newSaved
    if (saved.includes(eventId)) {
      newSaved = saved.filter((id: string) => id !== eventId)
      toast.success('Removed from saved events')
    } else {
      newSaved = [...saved, eventId]
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
      toast.success('Event saved!', {
        description: 'View your saved events anytime.',
      })
    }

    safeSetJSON('sweatbuddies_saved', newSaved)
    setIsSaved(!isSaved)

    // Trigger update for saved events section
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  // Different button styles based on context
  const buttonStyles = iconOnly
    ? `w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 ${
        isSaved
          ? 'bg-red-100 text-red-500'
          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
      }`
    : `w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all duration-200 ${
        isSaved
          ? 'bg-pink-500/30 hover:bg-pink-500/40'
          : 'bg-black/30 backdrop-blur-sm hover:bg-black/40'
      }`

  const iconStyles = iconOnly
    ? `w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
        isSaved ? 'text-red-500 fill-red-500' : 'text-neutral-600'
      }`
    : `w-3 h-3 sm:w-3.5 sm:h-3.5 transition-colors ${
        isSaved ? 'text-pink-400 fill-pink-400' : 'text-white/60'
      }`

  return (
    <button
      onClick={toggleSave}
      className={`flex items-center justify-center ${buttonStyles} ${isAnimating ? 'scale-125' : 'scale-100'} ${className}`}
      aria-label={isSaved ? 'Remove from saved' : 'Save event'}
      title={isSaved ? 'Saved to your list' : 'Save for later'}
    >
      <Heart className={iconStyles} />
    </button>
  )
}
