'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

export default function P2PStripeConnectPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success') === 'true'
  const refresh = searchParams.get('refresh') === 'true'

  const [status, setStatus] = useState<'loading' | 'enabled' | 'incomplete' | 'error'>('loading')
  const [reconnectUrl, setReconnectUrl] = useState<string | null>(null)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/stripe/connect/p2p')
        const data = await res.json()

        if (data.chargesEnabled) {
          setStatus('enabled')
        } else if (data.connected) {
          setStatus('incomplete')
          // Generate a fresh onboarding link
          const linkRes = await fetch('/api/stripe/connect/p2p', { method: 'POST' })
          const linkData = await linkRes.json()
          if (linkData.url) setReconnectUrl(linkData.url)
        } else {
          setStatus('incomplete')
          const linkRes = await fetch('/api/stripe/connect/p2p', { method: 'POST' })
          const linkData = await linkRes.json()
          if (linkData.url) setReconnectUrl(linkData.url)
        }
      } catch {
        setStatus('error')
      }
    }

    checkStatus()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (status === 'enabled') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Stripe connected</h1>
          <p className="text-sm text-neutral-500">
            Your account is ready to accept payments for paid sessions.
          </p>
          <button
            onClick={() => router.push('/buddy/host/new')}
            className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-black py-3 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Create a session
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Something went wrong</h1>
          <p className="text-sm text-neutral-500">Could not load your Stripe account status. Try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-black py-3 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // incomplete — show continue onboarding
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          {refresh ? 'Resume Stripe setup' : 'Stripe setup incomplete'}
        </h1>
        <p className="text-sm text-neutral-500">
          Your Stripe account isn&apos;t fully set up yet. Complete verification to start charging for sessions.
        </p>
        {reconnectUrl ? (
          <a
            href={reconnectUrl}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black py-3 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Continue setup
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}
        <button
          onClick={() => router.push('/buddy')}
          className="w-full text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 py-2 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
