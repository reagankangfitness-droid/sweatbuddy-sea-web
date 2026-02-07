'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'

export function DashboardHeader() {
  return (
    <header className="border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Back button + Logo */}
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/host/dashboard" />
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-900 dark:text-white hidden sm:inline">sweatbuddies</span>
          </Link>
        </div>

        {/* New Event Button */}
        <Link
          href="/host"
          className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
        >
          <span className="hidden sm:inline">+ New Event</span>
          <span className="sm:hidden">+ New</span>
        </Link>
      </div>
    </header>
  )
}
