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
      case 'rsvp': return { title: 'Almost there', subtitle: 'Sign in to confirm your spot' }
      case 'host': return { title: 'Start hosting', subtitle: 'Sign in to list plans and manage your community' }
      default: return { title: 'Welcome back', subtitle: 'Sign in to continue' }
    }
  }

  const content = getContextualContent()

  return (
    <div className="sb-page flex flex-col items-center justify-center px-4 py-8 pb-24 md:pb-8" data-sb-paper-shell>
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-1.5 text-sm text-[#17130E]/68 transition-colors hover:text-[#17130E]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-center mb-6">
          <Logo size={40} color="#17130E" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{content.title}</h1>
          <p className="mt-1 text-sm text-[#17130E]/68">{content.subtitle}</p>
        </div>

        <div className="sb-surface overflow-hidden">
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
                socialButtonsBlockButton: 'min-h-11 border-2 border-[#17130E] bg-[#F8F4EA] hover:bg-white rounded-md w-full py-3 shadow-[2px_2px_0_#17130E]',
                socialButtonsBlockButtonText: 'font-semibold text-[#17130E]/72',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerRow: 'my-4',
                dividerLine: 'bg-[#17130E]',
                dividerText: 'text-[#17130E]/62 text-sm px-3',
                formFieldLabel: 'text-[#17130E] font-medium text-sm',
                formFieldInput: 'min-h-11 border-2 border-[#17130E] bg-[#F8F4EA] text-[#17130E] focus:border-[#0B4BA8] focus:ring-[#0B4BA8]/10 rounded-md w-full py-3',
                formButtonPrimary: 'min-h-11 border-2 border-[#17130E] bg-[#E8412C] hover:bg-[#F0523E] text-white rounded-md w-full py-3 text-base font-bold disabled:bg-[#17130E]/18 disabled:text-[#17130E]/45',
                otpCodeFieldInput: 'border-[#17130E] bg-[#F8F4EA] text-[#17130E] text-lg',
                otpCodeFieldInputs: 'gap-2',
                footerAction: 'pt-4 justify-center',
                footerActionLink: 'text-[#0B4BA8] hover:text-[#17130E] font-medium',
                footer: 'hidden',
                identityPreview: 'justify-center',
                identityPreviewEditButton: 'text-[#17130E]/64',
                formFieldInputShowPasswordButton: 'min-h-11 min-w-11 text-[#17130E]/64',
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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="sb-page flex items-center justify-center" data-sb-paper-shell>
        <Loader2 className="w-6 h-6 animate-spin text-[#0B4BA8]" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
