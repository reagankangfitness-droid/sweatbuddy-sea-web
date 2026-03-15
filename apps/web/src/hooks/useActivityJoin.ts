'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { UrgencyLevel } from '@/lib/waitlist'

export interface SpotsInfo {
  totalSpots: number
  spotsRemaining: number
  spotsTaken: number
  percentFilled: number
  urgencyLevel: UrgencyLevel
  showSpotsRemaining: boolean
  urgencyThreshold: number
  waitlistEnabled: boolean
  waitlistLimit: number
  waitlistCount: number
  isFull: boolean
  userWaitlistStatus?: {
    isOnWaitlist: boolean
    position: number
    status: string
    notifiedAt: Date | null
    expiresAt: Date | null
  } | null
}

interface UserActivity {
  id: string
  userId: string
  status: string
  user: {
    id: string
    name: string | null
    imageUrl: string | null
    slug?: string | null
  }
}

interface UseActivityJoinOptions {
  activityMode?: string
  userActivities?: UserActivity[]
  onActivityRefresh: (data: any) => void
  onShowGoingSoloPrompt?: () => void
  requiresDeposit?: boolean
  depositAmount?: number | null // in cents
}

export function useActivityJoin(
  activityId: string,
  userId: string | null,
  options: UseActivityJoinOptions
) {
  const { activityMode, userActivities, onActivityRefresh, onShowGoingSoloPrompt, requiresDeposit, depositAmount: activityDepositAmount } = options
  const searchParams = useSearchParams()

  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [spotsInfo, setSpotsInfo] = useState<SpotsInfo | null>(null)
  const [userBookingId, setUserBookingId] = useState<string | null>(null)

  // Check if user has joined (runs when user loads or activity data changes)
  useEffect(() => {
    if (userId && userActivities) {
      const userRsvp = userActivities.find(
        (ua: any) => ua.userId === userId && ua.status === 'JOINED'
      )
      setHasJoined(!!userRsvp)
      setUserBookingId(userRsvp?.id || null)
    }
  }, [userId, userActivities])

  // Fetch spots info including waitlist status
  const fetchSpotsInfo = useCallback(async () => {
    if (!activityId) return

    try {
      const response = await fetch(`/api/waitlist/status?activityId=${activityId}`)
      if (response.ok) {
        const data = await response.json()
        setSpotsInfo(data)
      }
    } catch {
      // Error handled silently
    }
  }, [activityId])

  useEffect(() => {
    fetchSpotsInfo()
  }, [fetchSpotsInfo])

  // Refresh spots info when waitlist status changes
  const handleWaitlistChange = useCallback(async () => {
    await fetchSpotsInfo()
  }, [fetchSpotsInfo])

  // Called externally when payment success is detected
  const checkJoinStatus = useCallback(() => {
    setHasJoined(true)
    onShowGoingSoloPrompt?.()
  }, [onShowGoingSoloPrompt])

  const handleJoin = useCallback(async () => {
    if (!userId) {
      toast.error('Please sign in to join activities')
      return
    }

    setIsJoining(true)

    // P2P free sessions use the buddy join endpoint
    if (activityMode === 'P2P_FREE') {
      try {
        const joinBody: Record<string, unknown> = {}
        if (requiresDeposit) {
          joinBody.depositAmount = activityDepositAmount ?? 500
        }
        const res = await fetch(`/api/buddy/sessions/${activityId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(joinBody),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to join session')
          return
        }
        toast.success("You're in!")
        setHasJoined(true)
        onShowGoingSoloPrompt?.()
        const activityResponse = await fetch(`/api/activities/${activityId}`)
        const activityData = await activityResponse.json()
        onActivityRefresh(activityData)
      } catch {
        toast.error('Something went wrong')
      } finally {
        setIsJoining(false)
      }
      return
    }

    // Get invite code from URL if present (for referral discounts)
    const inviteCode = searchParams.get('invite') || searchParams.get('code')

    try {
      // Use the checkout session API for both free and paid activities
      // This ensures consistent handling and proper referral tracking
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activityId,
          inviteCode: inviteCode || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process booking')
      }

      const data = await response.json()

      // Handle free activities (no Stripe redirect)
      if (data.isFree) {
        toast.success('Successfully joined the activity!')
        setHasJoined(true)
        onShowGoingSoloPrompt?.()

        // Refresh activity data
        const activityResponse = await fetch(`/api/activities/${activityId}`)
        const activityData = await activityResponse.json()
        onActivityRefresh(activityData)
        setIsJoining(false)
        return
      }

      // For paid activities, redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process booking')
      setIsJoining(false)
    }
  }, [userId, activityId, activityMode, searchParams, onActivityRefresh, onShowGoingSoloPrompt, requiresDeposit, activityDepositAmount])

  const handleLeave = useCallback(async () => {
    if (!userId) return

    setIsJoining(true)

    // P2P sessions use the buddy leave endpoint
    if (activityMode?.startsWith('P2P')) {
      try {
        const res = await fetch(`/api/buddy/sessions/${activityId}/leave`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Failed to leave session')
          return
        }
        toast.success('Left session')
        setHasJoined(false)
        const activityResponse = await fetch(`/api/activities/${activityId}`)
        const data = await activityResponse.json()
        onActivityRefresh(data)
      } catch {
        toast.error('Something went wrong')
      } finally {
        setIsJoining(false)
      }
      return
    }

    try {
      const response = await fetch(`/api/activities/${activityId}/join`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to leave activity')
      }

      toast.success('Successfully left the activity')
      setHasJoined(false)

      // Refresh activity data
      const activityResponse = await fetch(`/api/activities/${activityId}`)
      const data = await activityResponse.json()
      onActivityRefresh(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave activity')
    } finally {
      setIsJoining(false)
    }
  }, [userId, activityId, activityMode, onActivityRefresh])

  // Build join button text that includes deposit info when applicable
  const joinButtonText = requiresDeposit && activityDepositAmount
    ? `Join - $${(activityDepositAmount / 100).toFixed(2)} deposit`
    : requiresDeposit
      ? 'Join - $5.00 deposit'
      : 'Join'

  return {
    isJoining,
    hasJoined,
    spotsInfo,
    userBookingId,
    handleJoin,
    handleLeave,
    handleWaitlistChange,
    checkJoinStatus,
    setHasJoined,
    joinButtonText,
  }
}
