'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

const BASE_URL = 'https://www.sweatbuddies.co'

export default function InviteSection() {
  const { user } = useUser()
  const [copied, setCopied] = useState(false)

  const inviteLink = user?.id ? `${BASE_URL}/sign-up?ref=${user.id}` : ''

  const copyInviteLink = useCallback(async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [inviteLink])

  const shareWhatsApp = useCallback(() => {
    if (!inviteLink) return
    const message = `Hey! I've been using SweatBuddies to find fitness sessions in Singapore. Check it out: ${inviteLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }, [inviteLink])

  if (!user?.id) return null

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 mb-8">
      <p className="text-xs text-[#666666] uppercase tracking-widest mb-2">Invite a friend</p>
      <p className="text-[13px] text-[#999999] mb-3">Share SweatBuddies with someone who&apos;d show up</p>
      <div className="flex gap-2">
        <button
          onClick={copyInviteLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider"
        >
          {copied ? 'Copied' : 'Copy invite link'}
        </button>
        <button
          onClick={shareWhatsApp}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-medium"
        >
          WhatsApp
        </button>
      </div>
    </div>
  )
}
