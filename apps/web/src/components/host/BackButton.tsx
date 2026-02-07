'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackHref?: string
  className?: string
}

export function BackButton({ fallbackHref = '/host/dashboard', className }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      // Fallback to specified route if no history
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={className || "w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
    </button>
  )
}
