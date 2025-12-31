'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStripeConnect } from '@/contexts/StripeConnectContext'

export interface StripeAccountStatus {
  id: string
  email: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
  } | null
  country: string | null
  defaultCurrency: string | null
}

export function useStripeAccountStatus() {
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { accountId, setAccountId } = useStripeConnect()

  const fetchAccountStatus = useCallback(async () => {
    if (!accountId) {
      setAccountStatus(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stripe/connect/account-status/${accountId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to fetch account status')
      }

      const data = await response.json()
      setAccountStatus(data)
    } catch (err) {
      console.error('Error fetching account status:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch account status'
      setError(message)
      // If account not found, clear it
      if (message.includes('No such account')) {
        setAccountId(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [accountId, setAccountId])

  // Fetch on mount and when accountId changes
  useEffect(() => {
    fetchAccountStatus()
  }, [fetchAccountStatus])

  // Poll for status updates every 5 seconds when not fully onboarded
  useEffect(() => {
    if (!accountId || (accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled)) {
      return
    }

    const intervalId = setInterval(fetchAccountStatus, 5000)
    return () => clearInterval(intervalId)
  }, [accountId, accountStatus?.chargesEnabled, accountStatus?.payoutsEnabled, fetchAccountStatus])

  const needsOnboarding = accountStatus
    ? !accountStatus.chargesEnabled || !accountStatus.detailsSubmitted
    : true

  const isFullyOnboarded = accountStatus
    ? accountStatus.chargesEnabled && accountStatus.payoutsEnabled && accountStatus.detailsSubmitted
    : false

  return {
    accountStatus,
    isLoading,
    error,
    needsOnboarding,
    isFullyOnboarded,
    refreshStatus: fetchAccountStatus,
  }
}
