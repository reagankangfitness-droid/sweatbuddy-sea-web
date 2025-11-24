'use client'

import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-white shadow-sm">
      <div className="max-w-container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-primary hover:text-primary-hover transition-all tracking-tight group">
          {/* sweatbuddies Droplet Logo */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 100 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform group-hover:scale-105"
          >
            {/* Main droplet shape */}
            <path
              d="M50 10 C70 30, 85 60, 85 85 C85 108, 68 125, 50 125 C32 125, 15 108, 15 85 C15 60, 30 30, 50 10 Z"
              fill="none"
              stroke="#FF2828"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner highlight curve */}
            <path
              d="M40 60 Q35 80, 45 100"
              fill="none"
              stroke="#FF2828"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          <span>sweatbuddies</span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <SignedIn>
            <Link href="/activities/new">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Activity</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}
