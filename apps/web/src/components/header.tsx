'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#080A0F]/90 backdrop-blur-xl border-b border-white/10 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-container mx-auto flex items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading font-bold text-white hover:text-[#3CCFBB] transition-all tracking-wide group"
            style={{ fontSize: '22px' }}
          >
            <span className="transition-transform group-hover:scale-110 duration-300">
              <Logo size={36} />
            </span>
            <span className="hidden sm:inline">sweatbuddies</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#events"
              className="font-body text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Events
            </a>
            <a
              href="#cities"
              className="font-body text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Cities
            </a>
            <a
              href="#mission"
              className="font-body text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              About
            </a>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Submit Event CTA */}
            <a href="#submit" className="hidden sm:block">
              <button className="btn-primary text-sm py-3 px-6">
                <span>Submit Event</span>
              </button>
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-[#080A0F]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${
            mobileMenuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <nav className="flex flex-col p-6 gap-4">
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-white/70 hover:text-white text-lg font-medium transition-colors py-2"
            >
              Events
            </a>
            <a
              href="#cities"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-white/70 hover:text-white text-lg font-medium transition-colors py-2"
            >
              Cities
            </a>
            <a
              href="#mission"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-white/70 hover:text-white text-lg font-medium transition-colors py-2"
            >
              About
            </a>
            <a
              href="#submit"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary text-center mt-2"
            >
              <span>Submit Event</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-0" />
    </>
  )
}
