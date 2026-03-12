'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/activities/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete session')
      }
    } catch {
      alert('Failed to delete session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1 text-xs font-semibold bg-red-900/50 text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Delete'}
    </button>
  )
}
