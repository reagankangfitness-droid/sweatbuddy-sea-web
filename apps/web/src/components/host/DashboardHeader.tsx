'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut, User } from 'lucide-react'
import { Logo } from '@/components/logo'
import { useClerk } from '@clerk/nextjs'

interface HostSession {
  instagramHandle: string
  name: string | null
  email: string
}

export function DashboardHeader() {
  const router = useRouter()
  const { signOut } = useClerk()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [session, setSession] = useState<HostSession | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/organizer/verify', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setSession({
            instagramHandle: data.organizer.instagramHandle,
            name: data.organizer.name,
            email: data.organizer.email,
          })
        }
      } catch {
        // Session fetch failed
      }
    }
    fetchSession()
  }, [])

  const handleLogout = async () => {
    // Clear legacy organizer session cookie
    await fetch('/api/organizer/verify', { method: 'DELETE' })
    // Sign out from Clerk and redirect to homepage
    await signOut(() => router.push('/'))
  }

  const navLinks = [
    { href: '/host/community', label: 'Community' },
    { href: '/host/analytics', label: 'Analytics' },
    { href: '/host/earnings', label: 'Earnings' },
  ]

  return (
    <header className="border-b border-neutral-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-lg font-bold text-neutral-900 hidden sm:inline">sweatbuddies</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/host"
            className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-700 transition-colors"
          >
            + New Event
          </Link>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4 pl-4 border-l border-neutral-200">
            {session && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-neutral-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  @{session.instagramHandle}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/host"
            className="inline-flex items-center justify-center px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-full"
          >
            + New
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white">
          {/* User Info */}
          {session && (
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">@{session.instagramHandle}</p>
                  <p className="text-xs text-neutral-500">{session.email}</p>
                </div>
              </div>
            </div>
          )}
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-neutral-100 mt-3 pt-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
