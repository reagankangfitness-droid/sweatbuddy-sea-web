'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'
import { EarningsDashboard } from '@/components/host/EarningsDashboard'

export default function EarningsPage() {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!res.ok) {
          router.push('/organizer')
          return
        }
        setIsVerifying(false)
      } catch {
        router.push('/organizer')
      }
    }

    verifySession()
  }, [router])

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center animate-pulse">
          <span className="text-4xl mb-4 block">💰</span>
          <p className="text-neutral-400">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/host/dashboard" />
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-neutral-900 hidden sm:inline">sweatbuddies</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <EarningsDashboard />
      </main>
    </div>
  )
}
