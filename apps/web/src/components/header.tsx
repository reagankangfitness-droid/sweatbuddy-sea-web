'use client'

import { UserButton, SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'
import { Logo } from '@/components/logo'
import { useEffect, useState } from 'react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isLoaded } = useAuth()

  // Ensure component only renders auth buttons after mount and auth load
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auth skeleton placeholder
  const AuthSkeleton = () => (
    <div className="w-20 h-9 bg-primary/10 rounded-lg animate-pulse" />
  )

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-header-scroll' : 'border-b border-border-subtle'
      }`}
    >
      <div className="max-w-container mx-auto flex h-16 items-center justify-between px-6 lg:px-10">
        {/* Logo - SweatBuddies Smiley */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-primary hover:text-primary-hover transition-all tracking-tight group"
          style={{ fontSize: '20px' }}
        >
          <span className="transition-transform group-hover:scale-105 duration-200">
            <Logo size={32} />
          </span>
          <span>sweatbuddies</span>
        </Link>

        {/* Right side actions - Premium layout */}
        <div className="flex items-center gap-2">
          {/* Show skeleton while auth is loading */}
          {(!mounted || !isLoaded) ? (
            <AuthSkeleton />
          ) : (
            <>
              <SignedIn>
                {/* Dashboard link - Icon on mobile, text on desktop */}
                <Link href="/dashboard">
                  <button
                    className="p-2 md:px-3 md:py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-5 h-5 md:hidden" />
                    <span className="hidden md:inline">Dashboard</span>
                  </button>
                </Link>

                {/* Create Activity - Primary CTA */}
                <Link href="/activities/new">
                  <Button
                    size="sm"
                    className="gap-1.5 shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Activity</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </Link>

                {/* Notifications */}
                <NotificationBell />

                {/* User Profile */}
                <div className="ml-1">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9'
                      }
                    }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                {/* Sign In Button */}
                <SignInButton mode="modal">
                  <Button size="sm" className="shadow-sm hover:shadow-md transition-all">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
