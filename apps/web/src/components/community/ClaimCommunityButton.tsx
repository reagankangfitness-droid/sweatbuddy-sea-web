'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Copy, Loader2, ShieldCheck } from 'lucide-react'

interface ClaimCommunityButtonProps {
  communitySlug: string
  communityName: string
  isSeeded: boolean
  claimedAt: string | null
  defaultVerificationUrl?: string | null
}

type ClaimStep = 'default' | 'start' | 'verify' | 'success' | 'error'

type ClaimResponse = {
  claim?: {
    verificationCode?: string
    verificationUrl?: string
  }
  instructions?: string
  error?: string
}

export function ClaimCommunityButton({
  communitySlug,
  communityName,
  isSeeded,
  claimedAt,
  defaultVerificationUrl,
}: ClaimCommunityButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<ClaimStep>('default')
  const [verificationUrl, setVerificationUrl] = useState(defaultVerificationUrl ?? '')
  const [verificationCode, setVerificationCode] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isSeeded || claimedAt) return null

  async function startClaim() {
    if (!verificationUrl.trim()) return
    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    try {
      const res = await fetch(`/api/communities/${communitySlug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationUrl: verificationUrl.trim() }),
      })
      const data = await res.json() as ClaimResponse

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to start claim')
        setStep('error')
        return
      }

      setVerificationCode(data.claim?.verificationCode ?? '')
      setVerificationUrl(data.claim?.verificationUrl ?? verificationUrl.trim())
      setMessage(data.instructions ?? '')
      setStep('verify')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function verifyClaim() {
    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    try {
      const res = await fetch(`/api/communities/${communitySlug}/claim/verify`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok && data.verified) {
        setStep('success')
        setTimeout(() => router.push('/hub'), 1200)
        return
      }

      setErrorMessage(data.error || 'Verification code not found yet')
      setStep('verify')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStep('verify')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyCode() {
    if (!verificationCode) return
    try {
      await navigator.clipboard.writeText(verificationCode)
      setMessage('Code copied.')
    } catch {
      setMessage(verificationCode)
    }
  }

  if (step === 'success') {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-semibold text-[#1A1A1A]">
          You can now manage {communityName}.
        </p>
        <p className="mt-1 text-xs text-[#71717A]">Taking you to your hub...</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-5">
      {step === 'default' && (
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-3 h-6 w-6 text-[#1A1A1A]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Manage this community
          </p>
          <p className="mt-1 mb-4 text-xs text-[#71717A]">
            Claim it by adding a short SweatBuddies code to the official page.
          </p>
          <button
            type="button"
            onClick={() => setStep('start')}
            className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Start claim
          </button>
        </div>
      )}

      {(step === 'start' || step === 'error') && (
        <div>
          <p className="mb-1 text-sm font-semibold text-[#1A1A1A]">
            Official page URL
          </p>
          <p className="mb-3 text-xs text-[#71717A]">
            Use the Instagram, Linktree, website, or public group page you can edit.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://instagram.com/yourcrew"
              value={verificationUrl}
              onChange={(event) => setVerificationUrl(event.target.value)}
              className="flex-1 rounded-xl border border-[#333333] bg-[#0D0D0D] px-3.5 py-2.5 text-sm text-white placeholder:text-[#666666] focus:border-[#666666] focus:outline-none"
              onKeyDown={(event) => { if (event.key === 'Enter') void startClaim() }}
              autoFocus
            />
            <button
              type="button"
              onClick={startClaim}
              disabled={isSubmitting || !verificationUrl.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Continue
            </button>
          </div>
          {errorMessage && (
            <p className="mt-2 text-xs text-red-500">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {step === 'verify' && (
        <div>
          <p className="mb-1 text-sm font-semibold text-[#1A1A1A]">
            Add this code to the page
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-[0.18em] text-[#1A1A1A]">
              {verificationCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#1A1A1A] hover:bg-black/5"
              aria-label="Copy verification code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#71717A]">
            {message || `Add ${verificationCode} to ${verificationUrl}, then check verification.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={verifyClaim}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Check verification
            </button>
            <button
              type="button"
              onClick={() => setStep('start')}
              disabled={isSubmitting}
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-black/5 disabled:opacity-40"
            >
              Change URL
            </button>
          </div>
          {errorMessage && (
            <p className="mt-2 text-xs text-red-500">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
