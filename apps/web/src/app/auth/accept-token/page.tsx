'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useSignIn } from '@clerk/nextjs'
import { AppLoadingScreen } from '@/components/AppLoadingScreen'

function isValidRedirect(url: string | null): url is string {
  if (!url || !url.startsWith('/')) return false
  try {
    const parsed = new URL(url, 'http://localhost')
    return parsed.origin === 'http://localhost'
  } catch {
    return false
  }
}

function AcceptTokenContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [error, setError] = useState('')

  const token = searchParams.get('token')
  const redirectUrl = useMemo(() => {
    const requestedRedirect = searchParams.get('redirect_url')
    return isValidRedirect(requestedRedirect) ? requestedRedirect : '/buddy'
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    async function acceptToken() {
      if (!isLoaded || !signIn || !token) return

      try {
        const result = await signIn.create({
          strategy: 'ticket',
          ticket: token,
        })

        if (cancelled) return

        if (result.status !== 'complete' || !result.createdSessionId) {
          setError('This sign-in link could not be completed.')
          return
        }

        await setActive({ session: result.createdSessionId })
        if (!cancelled) router.replace(redirectUrl)
      } catch (acceptError) {
        if (!cancelled) {
          setError(
            acceptError instanceof Error
              ? acceptError.message
              : 'This sign-in link could not be completed.',
          )
        }
      }
    }

    acceptToken()

    return () => {
      cancelled = true
    }
  }, [isLoaded, redirectUrl, router, setActive, signIn, token])

  if (!token) {
    return <TokenError message="Missing sign-in token." />
  }

  if (error) {
    return <TokenError message={error} />
  }

  return (
    <AppLoadingScreen
      label="Signing you in"
      detail="Opening your community map"
      compact
    />
  )
}

function TokenError({ message }: { message: string }) {
  return (
    <main className="sb-page flex min-h-[100dvh] items-center justify-center px-4" data-sb-paper-shell>
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-[#151816] p-5 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06]">
          <AlertCircle className="h-5 w-5 text-[#E8412C]" />
        </span>
        <p className="sb-eyebrow mt-5">Sign-in link</p>
        <h1 className="mt-3 text-2xl font-bold text-white">Link could not be used.</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">{message}</p>
        <Link href="/sign-in" className="sb-button-primary mt-6 w-full px-5">
          Sign in another way <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  )
}

export default function AcceptTokenPage() {
  return (
    <Suspense
      fallback={
        <AppLoadingScreen
          label="Signing you in"
          detail="Opening your community map"
          compact
        />
      }
    >
      <AcceptTokenContent />
    </Suspense>
  )
}
