'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
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
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
          </Link>
          <Link
            href="/host/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <EarningsDashboard />
      </main>
    </div>
  )
}
