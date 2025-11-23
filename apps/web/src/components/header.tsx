'use client'

import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="max-w-container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-foreground hover:opacity-80 transition-opacity tracking-tight">
          SweatBuddies
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
