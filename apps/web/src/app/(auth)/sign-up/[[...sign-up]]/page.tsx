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
  const rawRedirectUrl = searchParams.get('redirect_url')
  const redirectUrl = rawRedirectUrl && isValidRedirect(rawRedirectUrl) ? rawRedirectUrl : null

  useEffect(() => {
    if (intent) {
      sessionStorage.setItem('auth_intent', JSON.stringify({
        intent, eventId, eventSlug, timestamp: Date.now()
      }))
    }
  }, [intent, eventId, eventSlug])

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
      case 'rsvp': return { title: 'Join the event!', subtitle: 'Create an account to RSVP' }
      case 'host': return { title: 'Become a host', subtitle: 'Create an account to list your events' }
      default: return { title: 'Join SweatBuddies', subtitle: 'Find your fitness community' }
    }
  }

  const content = getContextualContent()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#999999] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-center mb-6">
          <Logo size={40} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{content.title}</h1>
          <p className="text-[#666666] text-sm mt-1">{content.subtitle}</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] overflow-hidden">
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
                socialButtonsBlockButton: 'border border-[#333333] hover:bg-[#2A2A2A] rounded-xl w-full py-3',
                socialButtonsBlockButtonText: 'font-medium text-[#999999]',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerRow: 'my-4',
                dividerLine: 'bg-[#333333]',
                dividerText: 'text-[#666666] text-sm px-3',
                formFieldLabel: 'text-[#999999] font-medium text-sm',
                formFieldInput: 'border-[#333333] bg-[#2A2A2A] text-white focus:border-white focus:ring-white/10 rounded-xl w-full py-3',
                formButtonPrimary: 'bg-white hover:bg-neutral-200 text-black rounded-xl w-full py-3 text-base font-semibold',
                otpCodeFieldInput: 'border-[#333333] bg-[#2A2A2A] text-white text-lg',
                otpCodeFieldInputs: 'gap-2',
                footerAction: 'pt-4 justify-center',
                footerActionLink: 'text-white hover:text-[#999999] font-medium',
                footer: 'hidden',
                identityPreview: 'justify-center',
                identityPreviewEditButton: 'text-[#666666]',
                formFieldInputShowPasswordButton: 'text-[#666666]',
                alert: 'rounded-xl',
                alertText: 'text-sm',
              }
            }}
            redirectUrl={redirectUrl || '/buddy'}
          />
        </div>

        <p className="text-center text-xs text-[#666666] mt-6">
          One account for everything — join and host sessions.
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="w-6 h-6 animate-spin text-[#666666]" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
