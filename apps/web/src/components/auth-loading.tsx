'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

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
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 100 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 10 C70 30, 85 60, 85 85 C85 108, 68 125, 50 125 C32 125, 15 108, 15 85 C15 60, 30 30, 50 10 Z"
                fill="none"
                stroke="#FFD230"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 60 Q35 80, 45 100"
                fill="none"
                stroke="#FFD230"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
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
