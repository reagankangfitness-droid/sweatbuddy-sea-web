'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'

export function DashboardHeader() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/organizer/verify', { method: 'DELETE' })
    router.push('/organizer')
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
            href="/#submit-desktop"
            className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-700 transition-colors"
          >
            + New Event
          </Link>

          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/#submit-desktop"
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
            <button
              onClick={() => {
                setIsMenuOpen(false)
                handleLogout()
              }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
