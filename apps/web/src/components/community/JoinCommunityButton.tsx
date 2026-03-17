'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Users, LogIn, Settings, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface JoinCommunityButtonProps {
  communitySlug: string
  communityName: string
  isMember: boolean
  isOwner: boolean
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
}

export function JoinCommunityButton({
  communitySlug,
  communityName,
  isMember,
  isOwner,
  privacy,
}: JoinCommunityButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)

  // Auto-join when user arrives with action=join after auth
  useEffect(() => {
    if (isSignedIn && searchParams.get('action') === 'join' && !isMember && !isOwner && privacy !== 'INVITE_ONLY') {
      handleJoin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, searchParams])

  const handleJoin = async () => {
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent(`/communities/${communitySlug}?action=join`)}`)
      return
    }

    if (privacy === 'INVITE_ONLY') {
      // Could show a modal to request invite
      return
    }

    setLoading(true)
    setJoining(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/join`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success(`You're in! Welcome to ${communityName}.`)
        router.refresh()

        // After successful join, scroll to events section
        setTimeout(() => {
          const eventsSection = document.getElementById('upcoming-events')
          if (eventsSection) {
            eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/leave`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-neutral-400 rounded-full font-medium"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        {joining ? 'Joining...' : 'Loading...'}
      </button>
    )
  }

  if (isOwner) {
    return (
      <a
        href={`/host/communities/${communitySlug}`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors"
      >
        <Settings className="w-5 h-5" />
        Manage
      </a>
    )
  }

  if (isMember) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-950 text-green-400 rounded-full text-sm font-medium">
          <Check className="w-4 h-4" />
          Joined
        </span>
        <button
          onClick={handleLeave}
          className="text-sm text-neutral-500 hover:text-red-500 transition-colors"
        >
          Leave
        </button>
      </div>
    )
  }

  if (privacy === 'INVITE_ONLY') {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-neutral-500 rounded-full font-medium cursor-not-allowed"
      >
        <LogIn className="w-5 h-5" />
        Invite Only
      </button>
    )
  }

  return (
    <button
      onClick={handleJoin}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors"
    >
      <Users className="w-5 h-5" />
      Join Community
    </button>
  )
}
