'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react'

interface StripeConnectContextType {
  accountId: string | null
  setAccountId: (id: string | null) => void
  isOnboarded: boolean
  clearAccount: () => void
}

const StripeConnectContext = createContext<StripeConnectContextType | undefined>(undefined)

export function useStripeConnect() {
  const context = useContext(StripeConnectContext)
  if (!context) {
    throw new Error('useStripeConnect must be used within a StripeConnectProvider')
  }
  return context
}

export function StripeConnectProvider({ children }: PropsWithChildren) {
  const [accountId, setAccountIdState] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('stripeConnectAccountId')
      if (stored) {
        setAccountIdState(stored)
      }
    }
  }, [])

  // Persist to localStorage when accountId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (accountId) {
        localStorage.setItem('stripeConnectAccountId', accountId)
      } else {
        localStorage.removeItem('stripeConnectAccountId')
      }
    }
  }, [accountId])

  const setAccountId = useCallback((id: string | null) => {
    setAccountIdState(id)
    if (id) {
      // When we set an account ID, assume it's onboarded
      // (the actual verification happens via API)
      setIsOnboarded(true)
    } else {
      setIsOnboarded(false)
    }
  }, [])

  const clearAccount = useCallback(() => {
    setAccountIdState(null)
    setIsOnboarded(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stripeConnectAccountId')
    }
  }, [])

  const value: StripeConnectContextType = {
    accountId,
    setAccountId,
    isOnboarded,
    clearAccount,
  }

  return (
    <StripeConnectContext.Provider value={value}>
      {children}
    </StripeConnectContext.Provider>
  )
}

export default StripeConnectProvider
