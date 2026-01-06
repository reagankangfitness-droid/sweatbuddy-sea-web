'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { Bell, BellRing, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { ActivityWaitlistStatus } from '@prisma/client'

interface UserWaitlistStatus {
  isOnWaitlist: boolean
  position: number
  status: ActivityWaitlistStatus | string
  notifiedAt: Date | null
  expiresAt: Date | null
}

interface WaitlistButtonProps {
  activityId: string
  activityTitle: string
  userWaitlistStatus?: UserWaitlistStatus | null
  waitlistCount?: number
  onStatusChange?: (status: { isOnWaitlist: boolean; position?: number }) => void
  variant?: 'default' | 'large' | 'compact'
  className?: string
}

// Helper function to get time remaining
function getTimeRemaining(expiresAt: Date | string | null): string {
  if (!expiresAt) return '24 hours'
  const diff = new Date(expiresAt).getTime() - Date.now()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} minutes`
}

export function WaitlistButton({
  activityId,
  activityTitle,
  userWaitlistStatus,
  waitlistCount = 0,
  onStatusChange,
  variant = 'default',
  className,
}: WaitlistButtonProps) {
  const { isSignedIn, user } = useUser()
  const [loading, setLoading] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isOnWaitlist, setIsOnWaitlist] = useState(!!userWaitlistStatus?.isOnWaitlist)
  const [position, setPosition] = useState(userWaitlistStatus?.position)
  const [waitlistStatus, setWaitlistStatus] = useState(userWaitlistStatus?.status)

  const handleJoinWaitlist = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // If not logged in and no email input shown, show it
    if (!isSignedIn && !showEmailInput) {
      setShowEmailInput(true)
      return
    }

    // Validate email if not logged in
    if (!isSignedIn && !email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          email: email || undefined,
          name: name || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.position) {
          // Already on waitlist
          setIsOnWaitlist(true)
          setPosition(data.position)
          toast.success(`You're already #${data.position} on the waitlist!`)
        } else {
          toast.error(data.error || 'Failed to join waitlist')
        }
        return
      }

      setIsOnWaitlist(true)
      setPosition(data.position)
      setShowEmailInput(false)
      toast.success(data.message || `You're #${data.position} on the waitlist!`)
      onStatusChange?.({ isOnWaitlist: true, position: data.position })
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveWaitlist = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, email }),
      })

      const data = await res.json()

      if (data.success) {
        setIsOnWaitlist(false)
        setPosition(undefined)
        toast.success('Removed from waitlist')
        onStatusChange?.({ isOnWaitlist: false })
      } else {
        toast.error('Failed to leave waitlist')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // User is notified - show urgent booking prompt
  if (waitlistStatus === 'NOTIFIED') {
    return (
      <div
        className={cn(
          'bg-gradient-to-r from-neutral-100 to-neutral-200 border-2 border-neutral-400 rounded-xl p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center animate-bounce">
            <BellRing size={20} />
          </div>
          <div>
            <div className="text-base font-bold text-neutral-900">A spot opened up!</div>
            <div className="text-sm text-neutral-600">Book now before it&apos;s gone</div>
          </div>
        </div>
        <div className="text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-300/50">
          Your spot expires in {getTimeRemaining(userWaitlistStatus?.expiresAt ?? null)}
        </div>
      </div>
    )
  }

  // Already on waitlist
  if (isOnWaitlist) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3 bg-success-light border border-success/20 rounded-xl',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center">
            <Check size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900">You&apos;re on the waitlist!</div>
            <div className="text-xs text-neutral-600">
              Position #{position} {waitlistCount > 1 && `of ${waitlistCount}`}
            </div>
          </div>
        </div>
        <button
          onClick={handleLeaveWaitlist}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Leave
        </button>
      </div>
    )
  }

  // Show email input for non-logged-in users
  if (showEmailInput) {
    return (
      <form onSubmit={handleJoinWaitlist} className={cn('bg-neutral-100 rounded-xl p-4', className)}>
        <div className="flex flex-col gap-2.5 mb-3">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="bg-white"
          />
          <Input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEmailInput(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !email}
            className="flex-[2] bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Join Waitlist
          </Button>
        </div>
        <p className="text-xs text-neutral-500 text-center mt-3">
          We&apos;ll notify you when a spot opens up
        </p>
      </form>
    )
  }

  // Default: Join waitlist button
  const buttonSizeClasses = {
    default: 'py-3.5 px-5 text-[15px]',
    large: 'py-4 px-6 text-base',
    compact: 'py-2.5 px-4 text-sm',
  }

  return (
    <Button
      onClick={handleJoinWaitlist}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl transition-colors',
        buttonSizeClasses[variant],
        className
      )}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          <Bell size={18} />
          <span>Join Waitlist</span>
          {waitlistCount > 0 && (
            <span className="opacity-70 pl-2.5 border-l border-white/30">
              {waitlistCount} waiting
            </span>
          )}
        </>
      )}
    </Button>
  )
}

// Compact inline waitlist indicator
export function WaitlistStatus({
  position,
  waitlistCount,
  className,
}: {
  position: number
  waitlistCount?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-sm text-neutral-700 bg-success-light px-3 py-1.5 rounded-lg',
        className
      )}
    >
      <Check size={14} className="text-success" />
      <span>
        #{position} on waitlist{waitlistCount && waitlistCount > 1 ? ` of ${waitlistCount}` : ''}
      </span>
    </div>
  )
}
