'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to unified dashboard at /host/dashboard
export default function OrganizerDashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/host/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center animate-pulse">
        <span className="text-4xl mb-4 block">📊</span>
        <p className="text-neutral-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
