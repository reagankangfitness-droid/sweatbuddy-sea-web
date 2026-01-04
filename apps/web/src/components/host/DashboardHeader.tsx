'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'

export function DashboardHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/organizer/verify', { method: 'DELETE' })
    router.push('/organizer')
  }

  return (
    <header className="border-b border-neutral-100 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Analytics Link */}
          <Link
            href="/host/analytics"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
          >
            Analytics
          </Link>

          {/* Earnings Link */}
          <Link
            href="/host/earnings"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
          >
            Earnings
          </Link>

          {/* New Event Button */}
          <Link
            href="/#submit-desktop"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-700 transition-colors"
          >
            + New Event
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
