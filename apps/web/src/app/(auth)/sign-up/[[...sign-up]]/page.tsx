'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'

function SignUpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Get intent from URL params
  const intent = searchParams.get('intent')
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

          if (Date.now() - timestamp < 10 * 60 * 1000) {
            sessionStorage.removeItem('auth_intent')

            if (savedIntent === 'rsvp' && (savedEventId || savedEventSlug)) {
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

      router.push(redirectUrl || '/dashboard')
    }
  }, [isLoaded, isSignedIn, router, redirectUrl])

  const getContextualContent = () => {
    switch (intent) {
      case 'rsvp':
        return {
          title: 'Join the event!',
          subtitle: 'Create an account to RSVP',
          emoji: '🎯'
        }
      case 'host':
        return {
          title: 'Become a host',
          subtitle: 'Create an account to list your events',
          emoji: '🏋️'
        }
      default:
        return {
          title: 'Join SweatBuddies',
          subtitle: 'Find your fitness community',
          emoji: '💪'
        }
    }
  }

  const content = getContextualContent()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size={40} />
        </div>

        {/* Contextual Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">{content.title}</h1>
          <p className="text-neutral-500 mt-1">{content.subtitle}</p>
        </div>

        {/* Clerk Sign Up */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none p-0 bg-transparent border-none',
                cardBox: 'shadow-none',
                header: 'hidden',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-neutral-200 hover:bg-neutral-50 rounded-lg',
                socialButtonsBlockButtonText: 'font-medium',
                dividerLine: 'bg-neutral-200',
                dividerText: 'text-neutral-400',
                formFieldLabel: 'text-neutral-700 font-medium',
                formFieldInput: 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900 rounded-lg',
                formButtonPrimary: 'bg-neutral-900 hover:bg-neutral-800 rounded-lg',
                footerAction: 'pt-4',
                footerActionLink: 'text-neutral-900 hover:text-neutral-700 font-medium',
                footer: 'hidden',
              }
            }}
            redirectUrl={redirectUrl || '/dashboard'}
          />
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          One account for everything — join events and host them.
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
