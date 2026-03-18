'use client'

import { useState } from 'react'

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
  const [state, setState] = useState<'default' | 'claiming' | 'success' | 'error'>('default')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only render if seeded and not yet claimed
  if (!isSeeded || claimedAt) {
    return null
  }

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
      <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <p className="text-green-400 font-medium">
          Community claimed! You are now the owner of {communityName}.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
      {state === 'default' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-amber-400 font-medium text-sm">
              Are you the owner of this community?
            </p>
            <p className="text-[#71717A] text-xs mt-0.5">
              Verify with your Instagram handle to take control.
            </p>
          </div>
          <button
            onClick={() => setState('claiming')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Claim it
          </button>
        </div>
      )}

      {(state === 'claiming' || state === 'error') && (
        <div>
          <p className="text-amber-400 font-medium text-sm mb-3">
            Are you the owner of this community?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="@your_instagram"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-black/[0.08] rounded-lg text-[#1A1A1A] text-sm placeholder:text-[#71717A] focus:outline-none focus:border-amber-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleClaim()
              }}
            />
            <button
              onClick={handleClaim}
              disabled={isSubmitting || !instagramHandle.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {isSubmitting ? 'Claiming...' : 'Claim this community'}
            </button>
          </div>
          {state === 'error' && errorMessage && (
            <div className="mt-2">
              <p className="text-red-400 text-xs">{errorMessage}</p>
              <a
                href="mailto:support@sweatbuddies.co"
                className="text-amber-400 hover:text-amber-300 text-xs underline mt-1 inline-block"
              >
                Contact support
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
