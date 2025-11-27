'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'

interface AuthLoadingProps {
  children: React.ReactNode
}

export function AuthLoading({ children }: AuthLoadingProps) {
  const { isLoaded } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  // Show loading state while auth is checking
  if (!isLoaded || !showContent) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="text-center">
          {/* SweatBuddies Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6 animate-pulse">
            <Logo size={48} />
            <span className="text-primary font-bold text-2xl tracking-tight">sweatbuddies</span>
          </div>

          {/* Loading Spinner */}
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />

          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
