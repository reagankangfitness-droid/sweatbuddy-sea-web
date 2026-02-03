'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Users, LogIn, Settings, Check, Loader2 } from 'lucide-react'

interface JoinCommunityButtonProps {
  communitySlug: string
  isMember: boolean
  isOwner: boolean
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
}

export function JoinCommunityButton({
  communitySlug,
  isMember,
  isOwner,
  privacy,
}: JoinCommunityButtonProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/communities/${communitySlug}`)
      return
    }

    if (privacy === 'INVITE_ONLY') {
      // Could show a modal to request invite
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/join`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
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
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-400 rounded-full font-medium"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading...
      </button>
    )
  }

  if (isOwner) {
    return (
      <a
        href={`/host/communities/${communitySlug}`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors"
      >
        <Settings className="w-5 h-5" />
        Manage
      </a>
    )
  }

  if (isMember) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
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
        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-500 rounded-full font-medium cursor-not-allowed"
      >
        <LogIn className="w-5 h-5" />
        Invite Only
      </button>
    )
  }

  return (
    <button
      onClick={handleJoin}
      className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors"
    >
      <Users className="w-5 h-5" />
      Join Community
    </button>
  )
}
