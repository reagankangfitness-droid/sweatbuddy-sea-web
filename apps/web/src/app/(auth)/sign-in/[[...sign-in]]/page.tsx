'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Get intent from URL params
  const intent = searchParams.get('intent') // 'rsvp', 'host', or null (general)
  const eventId = searchParams.get('eventId')
  const eventSlug = searchParams.get('eventSlug')
  const redirectUrl = searchParams.get('redirect_url')

  // Store intent in sessionStorage for post-auth routing
  useEffect(() => {
    if (intent) {
      sessionStorage.setItem('auth_intent', JSON.stringify({
        intent,
        eventId,
        eventSlug,
        timestamp: Date.now()
      }))
    }
  }, [intent, eventId, eventSlug])

  // Handle post-auth redirect
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const storedIntent = sessionStorage.getItem('auth_intent')

      if (storedIntent) {
        try {
          const { intent: savedIntent, eventId: savedEventId, eventSlug: savedEventSlug, timestamp } = JSON.parse(storedIntent)

          // Only use stored intent if it's recent (within 10 minutes)
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            sessionStorage.removeItem('auth_intent')

            if (savedIntent === 'rsvp' && (savedEventId || savedEventSlug)) {
              // Redirect to event page - RSVP will be handled there
              const eventPath = savedEventSlug || savedEventId
              router.push(`/e/${eventPath}?action=rsvp`)
              return
            }

            if (savedIntent === 'host') {
              router.push('/host?welcome=true')
              return
            }
          }
        } catch (e) {
          console.error('Error parsing auth intent:', e)
        }
        sessionStorage.removeItem('auth_intent')
      }

      // Default redirect
      router.push(redirectUrl || '/dashboard')
    }
  }, [isLoaded, isSignedIn, router, redirectUrl])

  // Contextual messaging based on intent
  const getContextualContent = () => {
    switch (intent) {
      case 'rsvp':
        return {
          title: 'Almost there!',
          subtitle: 'Sign in to confirm your spot',
          emoji: '🎯'
        }
      case 'host':
        return {
          title: 'Start hosting',
          subtitle: 'Sign in to list your fitness events',
          emoji: '🏋️'
        }
      default:
        return {
          title: 'Welcome back',
          subtitle: 'Sign in to continue',
          emoji: '👋'
        }
    }
  }

  const content = getContextualContent()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size={40} />
        </div>

        {/* Contextual Header */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-3 block">{content.emoji}</span>
          <h1 className="text-2xl font-bold text-neutral-900">{content.title}</h1>
          <p className="text-neutral-500 mt-1">{content.subtitle}</p>
        </div>

        {/* Clerk Sign In */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none p-0 bg-transparent',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border border-neutral-200 hover:bg-neutral-50',
              formFieldInput: 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900',
              formButtonPrimary: 'bg-neutral-900 hover:bg-neutral-800',
              footerActionLink: 'text-neutral-900 hover:text-neutral-700',
            }
          }}
          redirectUrl={redirectUrl || '/dashboard'}
        />

        {/* Footer Note */}
        <p className="text-center text-xs text-neutral-400 mt-8">
          One account for everything — join events and host them.
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
