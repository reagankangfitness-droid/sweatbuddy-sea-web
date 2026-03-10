'use client'

import { useState } from 'react'
import { ShieldOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BlockUserButtonProps {
  blockedUserId: string
  blockedUserName?: string
  onBlocked?: () => void
  className?: string
}

export function BlockUserButton({ blockedUserId, blockedUserName, onBlocked, className = '' }: BlockUserButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [blocking, setBlocking] = useState(false)

  async function handleBlock() {
    setBlocking(true)
    try {
      const res = await fetch('/api/buddy/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to block user')
        return
      }

      toast.success(`${blockedUserName ?? 'User'} blocked. You won't see their content.`)
      setConfirming(false)
      onBlocked?.()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setBlocking(false)
    }
  }

  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-neutral-500">Block {blockedUserName ?? 'this user'}?</span>
        <button
          onClick={handleBlock}
          disabled={blocking}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
        >
          {blocking ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 hover:border-neutral-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-500 transition-colors ${className}`}
    >
      <ShieldOff className="w-4 h-4" />
      Block user
    </button>
  )
}
