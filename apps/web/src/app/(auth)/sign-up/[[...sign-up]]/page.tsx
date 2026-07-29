'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'

function isValidRedirect(url: string): boolean {
  if (!url || !url.startsWith('/')) return false
  try {
    const parsed = new URL(url, 'http://localhost')
    return parsed.origin === 'http://localhost'
  } catch {
    return false
  }
}

function SignUpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  const intent = searchParams.get('intent')
  const eventId = searchParams.get('eventId')
  const eventSlug = searchParams.get('eventSlug')
  const ref = searchParams.get('ref')
  const rawRedirectUrl = searchParams.get('redirect_url')
  const redirectUrl = rawRedirectUrl && isValidRedirect(rawRedirectUrl) ? rawRedirectUrl : null

  useEffect(() => {
    if (intent) {
      sessionStorage.setItem('auth_intent', JSON.stringify({
        intent, eventId, eventSlug, timestamp: Date.now()
      }))
    }
  }, [intent, eventId, eventSlug])

  // Store referral source so it persists through the Clerk sign-up flow
  useEffect(() => {
    if (ref) {
      sessionStorage.setItem('sb_referrer', ref)
    }
  }, [ref])

  // After sign-up, persist referral to Clerk user metadata so the webhook can read it
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const storedRef = sessionStorage.getItem('sb_referrer')
      if (storedRef) {
        sessionStorage.removeItem('sb_referrer')
        // Fire-and-forget: update Clerk user metadata with referral source
        fetch('/api/user/set-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referredBy: storedRef }),
        }).catch(() => {})
      }
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const storedIntent = sessionStorage.getItem('auth_intent')
      if (storedIntent) {
        try {
          const { intent: savedIntent, eventId: savedEventId, eventSlug: savedEventSlug, timestamp } = JSON.parse(storedIntent)
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            sessionStorage.removeItem('auth_intent')
            if (savedIntent === 'rsvp' && (savedEventId || savedEventSlug)) {
              router.push(`/e/${savedEventSlug || savedEventId}?action=rsvp`)
              return
            }
            if (savedIntent === 'host') {
              router.push('/host?welcome=true')
              return
            }
          }
        } catch { /* ignore */ }
        sessionStorage.removeItem('auth_intent')
      }
      router.push(redirectUrl || '/buddy')
    }
  }, [isLoaded, isSignedIn, router, redirectUrl])

  const getContextualContent = () => {
    switch (intent) {
      case 'rsvp': return { title: 'Join the plan', subtitle: 'Create an account to save your spot' }
      case 'host': return { title: 'Become a host', subtitle: 'Create an account to list plans and bring people back' }
      default: return { title: 'Join SweatBuddies', subtitle: 'Find people through local fitness' }
    }
  }

  const content = getContextualContent()

  return (
    <div className="sb-page flex flex-col items-center justify-center px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-1.5 text-sm text-white/68 transition-colors hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-center mb-6">
          <Logo size={40} color="#FFFFFF" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{content.title}</h1>
          <p className="mt-1 text-sm text-white/68">{content.subtitle}</p>
        </div>

        <div className="sb-surface overflow-hidden">
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
                socialButtonsBlockButton: 'min-h-11 border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl w-full py-3',
                socialButtonsBlockButtonText: 'font-semibold text-white/76',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerRow: 'my-4',
                dividerLine: 'bg-white/12',
                dividerText: 'text-white/60 text-sm px-3',
                formFieldLabel: 'text-white/76 font-medium text-sm',
                formFieldInput: 'min-h-11 border-white/15 bg-[#101010] text-white focus:border-[#63FF8F] focus:ring-[#63FF8F]/10 rounded-xl w-full py-3',
                formButtonPrimary: 'min-h-11 bg-[#63FF8F] hover:bg-[#83FFA6] text-black rounded-xl w-full py-3 text-base font-bold',
                otpCodeFieldInput: 'border-white/15 bg-[#101010] text-white text-lg',
                otpCodeFieldInputs: 'gap-2',
                footerAction: 'pt-4 justify-center',
                footerActionLink: 'text-[#63FF8F] hover:text-white font-medium',
                footer: 'hidden',
                identityPreview: 'justify-center',
                identityPreviewEditButton: 'text-white/64',
                formFieldInputShowPasswordButton: 'min-h-11 min-w-11 text-white/64',
                alert: 'rounded-xl',
                alertText: 'text-sm',
              }
            }}
            fallbackRedirectUrl={redirectUrl || '/buddy'}
          />
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          One account for everything: join and host community plans.
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="sb-page flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#63FF8F]" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
