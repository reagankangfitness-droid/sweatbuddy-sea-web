'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useUser, SignInButton } from '@clerk/nextjs'

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
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

      if (pathname === '/') {
        scrollToElement(elementId)
      } else {
        router.push('/' + href)
      }
    }
  }, [pathname, router])

  const navLinks = [
    { href: '#events', label: 'Find a Workout' },
    { href: '#mission', label: 'About' },
    { href: '/host', label: 'Host With Us' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
          scrolled
            ? 'py-3 bg-white/95 backdrop-blur-lg border-b border-neutral-200'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-container mx-auto flex items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-semibold transition-colors ${
              scrolled ? 'text-neutral-800 hover:text-primary' : 'text-white hover:text-primary-200'
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
            {navLinks.map((link, index) => {
              const isHash = link.href.startsWith('#')
              if (isHash) {
                return (
                  <motion.button
                    key={link.href}
                    onClick={(e) => handleHashClick(e, link.href)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`text-sm font-medium transition-colors ${
                      scrolled
                        ? 'text-neutral-600 hover:text-neutral-800'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </motion.button>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-neutral-600 hover:text-neutral-800'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Login / Dashboard Button */}
            {isLoaded && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-neutral-700 hover:bg-neutral-100'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button
                    className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scrolled
                        ? 'text-neutral-700 hover:bg-neutral-100'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    Log In
                  </button>
                </SignInButton>
              )
            )}

            {/* Share Event CTA */}
            <motion.button
              onClick={(e) => handleHashClick(e, '#submit-desktop')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg transition-all duration-250 hover:bg-primary-hover active:scale-[0.98]"
            >
              Share Your Event
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-neutral-800 border border-neutral-200 bg-white hover:bg-neutral-50'
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
              className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-neutral-200 overflow-hidden"
            >
              <nav className="flex flex-col p-6 gap-1">
                {navLinks.map((link, index) => {
                  const isHash = link.href.startsWith('#')
                  if (isHash) {
                    return (
                      <motion.button
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onClick={(e) => {
                          setMobileMenuOpen(false)
                          handleHashClick(e, link.href)
                        }}
                        className="text-neutral-800 hover:text-primary text-lg font-medium transition-colors py-3 border-b border-neutral-100 last:border-0 text-left"
                      >
                        {link.label}
                      </motion.button>
                    )
                  }
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-neutral-800 hover:text-primary text-lg font-medium transition-colors py-3 border-b border-neutral-100 last:border-0"
                    >
                      {link.label}
                    </Link>
                  )
                })}

                {/* Login / Dashboard link in mobile menu */}
                {isLoaded && (
                  isSignedIn ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-neutral-800 hover:text-primary text-lg font-medium transition-colors py-3 border-b border-neutral-100"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                  ) : (
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-neutral-800 hover:text-primary text-lg font-medium transition-colors py-3 border-b border-neutral-100 text-left w-full"
                      >
                        Log In
                      </button>
                    </SignInButton>
                  )
                )}

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={(e) => {
                    setMobileMenuOpen(false)
                    handleHashClick(e, '#submit-mobile')
                  }}
                  className="flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Share Your Event
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
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
