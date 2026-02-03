'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle, ExternalLink, CreditCard } from 'lucide-react'

interface StripeConnectSetupProps {
  eventId: string
  contactEmail: string
  onStatusChange?: (status: StripeAccountStatus) => void
}

interface StripeAccountStatus {
  exists: boolean
  accountId?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  onboardingComplete: boolean
}

export function StripeConnectSetup({ eventId, contactEmail, onStatusChange }: StripeConnectSetupProps) {
  const [status, setStatus] = useState<StripeAccountStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  // Fetch current Stripe account status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/stripe/connect/status?eventId=${eventId}`)
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
          onStatusChange?.(data)
        } else {
          // No account exists yet
          setStatus({
            exists: false,
            chargesEnabled: false,
            payoutsEnabled: false,
            onboardingComplete: false,
          })
        }
      } catch {
        setStatus({
          exists: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          onboardingComplete: false,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [eventId, onStatusChange])

  // Check for Stripe onboarding return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe_onboarding') === 'complete') {
      // Refresh status after onboarding
      setIsLoading(true)
      fetch(`/api/stripe/connect/status?eventId=${eventId}`)
        .then(res => res.json())
        .then(data => {
          setStatus(data)
          onStatusChange?.(data)
        })
        .finally(() => setIsLoading(false))

      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('stripe_onboarding')
      window.history.replaceState({}, '', url.toString())
    }
  }, [eventId, onStatusChange])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // Step 1: Create or get existing Stripe account
      const createRes = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactEmail,
          eventSubmissionId: eventId,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error?.message || 'Failed to create Stripe account')
      }

      const { accountId } = await createRes.json()

      // Step 2: Create account link for onboarding
      const linkRes = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          eventSubmissionId: eventId,
        }),
      })

      if (!linkRes.ok) {
        const data = await linkRes.json()
        throw new Error(data.error?.message || 'Failed to create onboarding link')
      }

      const { url } = await linkRes.json()

      // Step 3: Redirect to Stripe onboarding
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe')
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking Stripe status...</span>
        </div>
      </div>
    )
  }

  const openDashboard = async () => {
    try {
      const res = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to open dashboard')
      }

      const { url } = await res.json()
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open dashboard')
    }
  }

  // Account exists and is fully set up
  if (status?.chargesEnabled && status?.payoutsEnabled) {
    return (
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Stripe Connected</p>
            <p className="text-sm text-green-700 mt-0.5">
              Your account is set up and ready to receive payments.
            </p>
            <button
              onClick={openDashboard}
              className="mt-2 text-sm text-green-700 hover:text-green-900 font-medium underline"
            >
              View Stripe Dashboard →
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  // Account exists but onboarding incomplete
  if (status?.exists && status.accountId) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Complete Stripe Setup</p>
            <p className="text-sm text-amber-700 mt-0.5 mb-3">
              Your Stripe account needs additional information before you can accept payments.
            </p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Continue Setup
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  // No account - show connect button
  return (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-blue-800">Connect Stripe to Accept Payments</p>
          <p className="text-sm text-blue-700 mt-0.5 mb-3">
            Set up your Stripe account to receive payments directly to your bank. Takes about 5 minutes.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect with Stripe
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-xs text-blue-600 mt-2">
            5% platform fee + Stripe processing fees (~2.9% + $0.30)
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
