'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'

function SignUpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Get intent from URL params
  const intent = searchParams.get('intent')
  const eventId = searchParams.get('eventId')
  const eventSlug = searchParams.get('eventSlug')
  const rawRedirectUrl = searchParams.get('redirect_url')
  // Prevent open redirect -- only allow relative paths
  const redirectUrl = rawRedirectUrl && rawRedirectUrl.startsWith('/') && !rawRedirectUrl.startsWith('//') ? rawRedirectUrl : null

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
        } catch {
          // Error handled silently
        }
        sessionStorage.removeItem('auth_intent')
      }

      router.push(redirectUrl || '/buddy')
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size={40} />
        </div>

        {/* Contextual Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">{content.title}</h1>
          <p className="text-neutral-500 mt-1">{content.subtitle}</p>
        </div>

        {/* Clerk Sign Up */}
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 shadow-sm overflow-hidden">
          <SignUp
            appearance={{
              layout: {
                socialButtonsPlacement: 'top',
                socialButtonsVariant: 'blockButton',
                logoPlacement: 'none',
              },
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none p-5 bg-transparent border-none w-full',
                cardBox: 'shadow-none w-full',
                logoBox: 'hidden',
                logoImage: 'hidden',
                header: 'hidden',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                main: 'w-full gap-4',
                form: 'w-full gap-4',
                formFieldRow: 'w-full',
                formField: 'w-full gap-1',
                socialButtons: 'w-full',
                socialButtonsBlockButton: 'border border-neutral-800 hover:bg-neutral-900 rounded-xl w-full py-3',
                socialButtonsBlockButtonText: 'font-medium text-neutral-300',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerRow: 'my-4',
                dividerLine: 'bg-neutral-700',
                dividerText: 'text-neutral-400 text-sm px-3',
                formFieldLabel: 'text-neutral-300 font-medium text-sm',
                formFieldInput: 'border-neutral-800 bg-neutral-900 text-white focus:border-neutral-500 focus:ring-white rounded-xl w-full py-3',
                formButtonPrimary: 'bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl w-full py-3 text-base font-semibold',
                otpCodeFieldInput: 'border-neutral-700 bg-neutral-900 text-white text-lg',
                otpCodeFieldInputs: 'gap-2',
                footerAction: 'pt-4 justify-center',
                footerActionLink: 'text-neutral-100 hover:text-neutral-300 font-medium',
                footer: 'hidden',
                identityPreview: 'justify-center',
                identityPreviewEditButton: 'text-neutral-400',
                formFieldInputShowPasswordButton: 'text-neutral-500',
                alert: 'rounded-xl',
                alertText: 'text-sm',
              }
            }}
            redirectUrl={redirectUrl || '/buddy'}
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
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
