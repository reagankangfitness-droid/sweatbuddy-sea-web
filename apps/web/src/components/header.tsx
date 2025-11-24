'use client'

import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-header-scroll' : 'border-b border-border-subtle'
      }`}
    >
      <div className="max-w-container mx-auto flex h-16 items-center justify-between px-6 lg:px-10">
        {/* Logo - Premium Airbnb style */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-primary hover:text-primary-hover transition-all tracking-tight group"
          style={{ fontSize: '22px' }}
        >
          {/* sweatbuddies Droplet Logo */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 100 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform group-hover:scale-105 duration-200"
          >
            {/* Main droplet shape */}
            <path
              d="M50 10 C70 30, 85 60, 85 85 C85 108, 68 125, 50 125 C32 125, 15 108, 15 85 C15 60, 30 30, 50 10 Z"
              fill="none"
              stroke="#0066FF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner highlight curve */}
            <path
              d="M40 60 Q35 80, 45 100"
              fill="none"
              stroke="#0066FF"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          <span>sweatbuddies</span>
        </Link>

        {/* Right side actions - Premium layout */}
        <div className="flex items-center gap-2">
          <SignedIn>
            {/* Dashboard link - Desktop only */}
            <Link href="/dashboard" className="hidden md:block">
              <button
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Dashboard
              </button>
            </Link>

            {/* Create Activity - Primary CTA */}
            <Link href="/activities/new">
              <Button
                size="sm"
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Activity</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>

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
        </div>
      </div>
    </header>
  )
}
