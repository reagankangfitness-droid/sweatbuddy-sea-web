'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { UserPlus, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FollowButtonProps {
  communityId: string | null
  instagramHandle: string | null
  isFollowing: boolean
  compact?: boolean
}

export function FollowButton({
  communityId,
  instagramHandle,
  isFollowing: initialFollowing,
  compact = false,
}: FollowButtonProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleFollow = async () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/community/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          communityId ? { communityId } : { instagramHandle }
        ),
      })

      if (res.ok) {
        setIsFollowing(true)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async () => {
    if (!communityId) return
    setLoading(true)
    try {
      const res = await fetch('/api/community/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId }),
      })

      if (res.ok) {
        setIsFollowing(false)
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
        className={`inline-flex items-center gap-1.5 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        } bg-neutral-800 text-neutral-400 rounded-full font-medium`}
      >
        <Loader2 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
      </button>
    )
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleUnfollow}
        className={`inline-flex items-center gap-1.5 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        } bg-green-950 text-green-400 rounded-full font-medium hover:bg-red-950 hover:text-red-400 transition-colors group`}
      >
        <Check className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} group-hover:hidden`} />
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:inline">Unfollow</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleFollow}
      className={`inline-flex items-center gap-1.5 ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } bg-white text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors`}
    >
      <UserPlus className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
      Follow
    </button>
  )
}
