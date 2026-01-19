'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'
import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ArrowRight, LayoutDashboard, User, LogOut, ChevronDown, Calendar, HelpCircle } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'

// Helper to scroll to element with retry for dynamic content
const scrollToElement = (elementId: string, maxAttempts = 10) => {
  let attempts = 0

  const tryScroll = () => {
    const element = document.getElementById(elementId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      return true
    }

    attempts++
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 100)
    }
    return false
  }

  tryScroll()
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle hash on page load/navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.slice(1)
      setTimeout(() => scrollToElement(hash), 300)
    }
  }, [pathname])

  const handleHashClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    if (href.startsWith('#')) {
      const elementId = href.slice(1)

      // Always try to scroll first if element exists on current page
      const element = document.getElementById(elementId)
      if (element) {
        scrollToElement(elementId)
      } else if (pathname !== '/') {
        // Only navigate if element not found and not on homepage
        router.push('/' + href)
      } else {
        // On homepage but element not found yet - retry with delay
        scrollToElement(elementId)
      }
    }
  }, [pathname, router])

  const navLinks = [
    { href: '#events', label: 'Find Events' },
    { href: '#mission', label: 'About' },
    { href: '/host', label: 'List Your Event' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
          scrolled
            ? 'py-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-container mx-auto flex items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-semibold transition-colors ${
              scrolled ? 'text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300' : 'text-white hover:text-primary-200'
            }`}
            style={{ fontSize: '18px', letterSpacing: '-0.02em' }}
          >
            <motion.span
              whileHover={{ rotate: -5 }}
              transition={{ duration: 0.15 }}
            >
              <Logo size={scrolled ? 28 : 32} />
            </motion.span>
            <span className="font-semibold">sweatbuddies</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    scrolled
                      ? 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle variant="header" isScrolled={scrolled} />
            </div>

            {/* Login / User Menu */}
            {isLoaded && (
              isSignedIn ? (
                <div className="relative hidden sm:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scrolled
                        ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || 'Profile'}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        scrolled ? 'bg-neutral-200' : 'bg-white/20'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 overflow-hidden"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <User className="w-4 h-4 text-neutral-400" />
                          Profile
                        </Link>
                        <Link
                          href="/my-bookings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          My Bookings
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                          Dashboard
                        </Link>
                        <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                        <Link
                          href="/support"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-neutral-400" />
                          Help & Support
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            signOut(() => router.push('/'))
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4 text-neutral-400" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Log In
                </Link>
              )
            )}

            {/* List Event CTA */}
            <Link
              href="/host"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg transition-all duration-250 hover:bg-primary-hover active:scale-[0.98]"
            >
              Be a Host
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  : 'text-white border border-white/30 hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <nav className="flex flex-col p-6 gap-1">
                {navLinks.map((link) =>
                  link.href.startsWith('#') ? (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      {link.label}
                    </Link>
                  )
                )}

                {/* Login / User links in mobile menu */}
                {isLoaded && (
                  isSignedIn ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <User className="w-5 h-5" />
                        Profile
                      </Link>
                      <Link
                        href="/my-bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <Calendar className="w-5 h-5" />
                        My Bookings
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <HelpCircle className="w-5 h-5" />
                        Help & Support
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          signOut(() => router.push('/'))
                        }}
                        className="flex items-center gap-2 text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800 w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-neutral-800 dark:text-white hover:text-primary dark:hover:text-neutral-300 text-lg font-medium transition-colors py-3 border-b border-neutral-100 dark:border-neutral-800 block"
                    >
                      Log In
                    </Link>
                  )
                )}

                <Link
                  href="/host"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Be a Host
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-0" />
    </>
  )
}
