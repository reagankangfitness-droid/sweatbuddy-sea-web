'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'
import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#events', label: "What's On" },
    { href: '#mission', label: 'About' },
    { href: '/organizer', label: 'For Hosts' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-sand/95 backdrop-blur-lg border-b border-forest-200 shadow-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-container mx-auto flex items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-display font-semibold transition-all group ${
              scrolled ? 'text-forest-900 hover:text-coral' : 'text-sand hover:text-coral'
            }`}
            style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
          >
            <motion.span
              whileHover={{ rotate: -5 }}
              transition={{ duration: 0.15 }}
            >
              <Logo size={scrolled ? 28 : 32} />
            </motion.span>
            <span>sweatbuddies</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => {
              const isExternal = link.href.startsWith('#')
              const Component = isExternal ? motion.a : motion(Link)
              return (
                <Component
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2 }}
                  className={`font-body text-sm font-medium transition-colors relative group ${
                    scrolled ? 'text-forest-600 hover:text-coral' : 'text-sand/70 hover:text-sand'
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-200 group-hover:w-full ${
                    scrolled ? 'bg-coral' : 'bg-sand'
                  }`} />
                </Component>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Submit Event CTA */}
            <motion.a
              href="#submit"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ x: -2, y: -2 }}
              whileTap={{ x: 1, y: 1 }}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-coral text-white font-semibold text-sm rounded-full transition-all duration-150 hover:bg-coral-600 shadow-md"
            >
              Submit Event
              <ArrowRight className="w-4 h-4" />
            </motion.a>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-full transition-colors ${
                scrolled
                  ? 'text-forest-900 border border-forest-200 bg-cream hover:bg-forest-100'
                  : 'text-sand border border-sand/50 hover:bg-sand/10'
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
              className="md:hidden absolute top-full left-0 right-0 bg-sand/95 backdrop-blur-lg border-b border-forest-200 shadow-lg overflow-hidden"
            >
              <nav className="flex flex-col p-6 gap-1">
                {navLinks.map((link, index) => {
                  const isExternal = link.href.startsWith('#')
                  const Component = isExternal ? motion.a : motion(Link)
                  return (
                    <Component
                      key={link.href}
                      href={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-body text-forest-900 hover:text-coral text-lg font-medium transition-colors py-3 border-b border-forest-100 last:border-0"
                    >
                      {link.label}
                    </Component>
                  )
                })}
                <motion.a
                  href="#submit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-coral text-white font-semibold rounded-full shadow-md hover:bg-coral-600 transition-colors"
                >
                  Submit Event
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
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
