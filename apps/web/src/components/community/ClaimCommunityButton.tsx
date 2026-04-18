'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface ClaimCommunityButtonProps {
  communitySlug: string
  communityName: string
  isSeeded: boolean
  claimedAt: string | null
  claimableBy: string | null
}

export function ClaimCommunityButton({
  communitySlug,
  communityName,
  isSeeded,
  claimedAt,
}: ClaimCommunityButtonProps) {
  const router = useRouter()
  const [state, setState] = useState<'default' | 'claiming' | 'success' | 'error'>('default')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isSeeded || claimedAt) return null

  async function handleClaim() {
    if (!instagramHandle.trim()) return
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch(`/api/communities/${communitySlug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramHandle: instagramHandle.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setState('success')
        // Redirect to Hub after a brief success message
        setTimeout(() => router.push('/hub'), 1500)
      } else {
        setErrorMessage(data.error || 'Failed to claim community')
        setState('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setState('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'success') {
    return (
      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#1A1A1A]">
          You now own {communityName}!
        </p>
        <p className="text-xs text-[#71717A] mt-1">Taking you to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-white border border-black/[0.06] rounded-2xl p-5">
      {state === 'default' && (
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Is this your community?
          </p>
          <p className="text-xs text-[#71717A] mt-1 mb-4">
            Claim it to manage sessions, see who&apos;s coming, and grow your crew.
          </p>
          <button
            onClick={() => setState('claiming')}
            className="px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:bg-black transition-colors"
          >
            Claim this community
          </button>
        </div>
      )}

      {(state === 'claiming' || state === 'error') && (
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
            Verify you&apos;re the owner
          </p>
          <p className="text-xs text-[#71717A] mb-3">
            Enter the Instagram handle linked to this community.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="@your_instagram"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-[#0D0D0D] border border-[#333333] rounded-xl text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-[#666666]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleClaim() }}
              autoFocus
            />
            <button
              onClick={handleClaim}
              disabled={isSubmitting || !instagramHandle.trim()}
              className="px-4 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-xl hover:bg-black disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {state === 'error' && errorMessage && (
            <p className="text-xs text-red-500 mt-2">
              {errorMessage} — <a href="mailto:support@sweatbuddies.co" className="underline">contact support</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
