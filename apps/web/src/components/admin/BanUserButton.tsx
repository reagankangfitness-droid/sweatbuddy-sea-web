'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BanUserButton({ userId, accountStatus }: { userId: string; accountStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isBanned = accountStatus === 'BANNED'

  const handleToggleBan = async () => {
    let reason: string | null = null

    if (!isBanned) {
      reason = prompt('Ban this user?\n\nReason (optional, shown to admins):')
      if (reason === null) return // cancelled
    } else {
      if (!confirm('Unban this user? They will regain full access.')) return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban: !isBanned, reason: reason || undefined }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update user')
      }
    } catch {
      alert('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleBan}
      disabled={loading}
      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
        isBanned
          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
          : 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900'
      }`}
    >
      {loading ? '...' : isBanned ? 'Unban' : 'Ban'}
    </button>
  )
}
