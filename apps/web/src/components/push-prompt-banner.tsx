'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'

const DISMISSED_KEY = 'sweatbuddies_push_prompt_dismissed'

/**
 * Subtle banner that prompts users to enable push notifications.
 * Only shown when:
 * - User is signed in
 * - Browser supports push notifications
 * - User hasn't already subscribed or denied permission
 * - User has RSVP'd to at least 1 event
 * - User hasn't dismissed this banner before
 */
export function PushPromptBanner() {
  const { isSignedIn } = useUser()
  const { isSupported, isSubscribed, permission, subscribe, isLoading } =
    usePushNotifications()
  const [eligible, setEligible] = useState(false)
  const [dismissed, setDismissed] = useState(true) // Start hidden
  const [checking, setChecking] = useState(true)

  // Check eligibility (has user RSVP'd to at least 1 event?)
  useEffect(() => {
    if (!isSignedIn) {
      setChecking(false)
      return
    }

    // Check if previously dismissed
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') {
        setChecking(false)
        return
      }
    } catch {
      // localStorage may not be available
    }

    setDismissed(false)

    const checkEligibility = async () => {
      try {
        const res = await fetch('/api/push/eligibility')
        if (res.ok) {
          const data = await res.json()
          setEligible(data.eligible)
        }
      } catch {
        // Silently fail
      } finally {
        setChecking(false)
      }
    }

    checkEligibility()
  }, [isSignedIn])

  const handleEnable = useCallback(async () => {
    const success = await subscribe()
    if (success) {
      setDismissed(true)
    }
  }, [subscribe])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // localStorage may not be available
    }
  }, [])

  // Don't render if any condition isn't met
  if (
    checking ||
    dismissed ||
    !isSignedIn ||
    !isSupported ||
    isSubscribed ||
    permission === 'denied' ||
    !eligible
  ) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Stay in the loop
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified when your buddies RSVP, events fill up, or new
              activities drop nearby.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Enabling...' : 'Enable notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
