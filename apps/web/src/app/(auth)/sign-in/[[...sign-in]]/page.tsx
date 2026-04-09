'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
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

function SignInContent() {
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
      case 'rsvp': return { title: 'Almost there!', subtitle: 'Sign in to confirm your spot' }
      case 'host': return { title: 'Start hosting', subtitle: 'Sign in to list your fitness events' }
      default: return { title: 'Welcome back', subtitle: 'Sign in to continue' }
    }
  }

  const content = getContextualContent()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFBF8] px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#4A4A5A] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-center mb-6">
          <Logo size={40} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{content.title}</h1>
          <p className="text-[#71717A] text-sm mt-1">{content.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <SignIn
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
                socialButtonsBlockButton: 'border border-black/[0.06] hover:bg-[#FFFBF8] rounded-xl w-full py-3',
                socialButtonsBlockButtonText: 'font-medium text-[#4A4A5A]',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerRow: 'my-4',
                dividerLine: 'bg-black/[0.06]',
                dividerText: 'text-[#9A9AAA] text-sm px-3',
                formFieldLabel: 'text-[#4A4A5A] font-medium text-sm',
                formFieldInput: 'border-black/[0.06] bg-[#FFFBF8] text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-[#1A1A1A]/10 rounded-xl w-full py-3',
                formButtonPrimary: 'bg-[#1A1A1A] hover:bg-black text-white rounded-xl w-full py-3 text-base font-semibold',
                otpCodeFieldInput: 'border-black/[0.06] bg-[#FFFBF8] text-[#1A1A1A] text-lg',
                otpCodeFieldInputs: 'gap-2',
                footerAction: 'pt-4 justify-center',
                footerActionLink: 'text-[#1A1A1A] hover:text-[#4A4A5A] font-medium',
                footer: 'hidden',
                identityPreview: 'justify-center',
                identityPreviewEditButton: 'text-[#71717A]',
                formFieldInputShowPasswordButton: 'text-[#71717A]',
                alert: 'rounded-xl',
                alertText: 'text-sm',
              }
            }}
            forceRedirectUrl={redirectUrl || '/buddy'}
          />
        </div>

        <p className="text-center text-xs text-[#9A9AAA] mt-6">
          One account for everything — join and host sessions.
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBF8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
