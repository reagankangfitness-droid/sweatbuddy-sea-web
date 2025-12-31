'use client'

import { useState } from 'react'
import { useStripeConnect } from '@/contexts/StripeConnectContext'
import { useStripeAccountStatus } from '@/hooks/useStripeAccountStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface StripeConnectOnboardingProps {
  eventSubmissionId?: string
  hostEmail?: string
  onComplete?: () => void
}

export function StripeConnectOnboarding({
  eventSubmissionId,
  hostEmail = '',
  onComplete,
}: StripeConnectOnboardingProps) {
  const [email, setEmail] = useState(hostEmail)
  const [isCreating, setIsCreating] = useState(false)
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const { accountId, setAccountId, clearAccount } = useStripeConnect()
  const { accountStatus, isLoading, needsOnboarding, isFullyOnboarded, refreshStatus } =
    useStripeAccountStatus()

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, eventSubmissionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to create account')
      }

      const data = await response.json()
      setAccountId(data.accountId)
      refreshStatus()
    } catch (error) {
      console.error('Error creating account:', error)
      setCreateError(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartOnboarding = async () => {
    if (!accountId) return

    setIsStartingOnboarding(true)

    try {
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, eventSubmissionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to create account link')
      }

      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating account link:', error)
    } finally {
      setIsStartingOnboarding(false)
    }
  }

  // If fully onboarded, show success state
  if (isFullyOnboarded && accountStatus) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Stripe Connected
          </CardTitle>
          <CardDescription className="text-green-600">
            Your account is set up to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account ID</span>
              <p className="font-mono text-xs">{accountStatus.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p>{accountStatus.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Payments enabled</span>
            <CheckCircle2 className="h-4 w-4 ml-4" />
            <span>Payouts enabled</span>
          </div>
          {onComplete && (
            <Button onClick={onComplete} className="w-full">
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // If account exists but needs onboarding
  if (accountId && accountStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Complete Stripe Setup
          </CardTitle>
          <CardDescription>
            Finish setting up your Stripe account to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Account ID</span>
              <span className="font-mono text-xs">{accountStatus.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Charges enabled</span>
              <span>{accountStatus.chargesEnabled ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span>Payouts enabled</span>
              <span>{accountStatus.payoutsEnabled ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span>Details submitted</span>
              <span>{accountStatus.detailsSubmitted ? '✅' : '❌'}</span>
            </div>
          </div>

          {needsOnboarding && (
            <Button
              onClick={handleStartOnboarding}
              disabled={isStartingOnboarding}
              className="w-full"
            >
              {isStartingOnboarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          <Button variant="outline" onClick={clearAccount} className="w-full">
            Use Different Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading && accountId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // No account - show create form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Stripe Account</CardTitle>
        <CardDescription>
          Set up Stripe to receive payments for your paid events. Funds go directly to your bank
          account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email for Stripe Account</Label>
            <Input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This email will be used for your Stripe account. You&apos;ll receive payment
              notifications here.
            </p>
          </div>

          {createError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {createError}
            </div>
          )}

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Set Up Stripe Account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
