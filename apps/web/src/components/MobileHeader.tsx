'use client'

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react'
import { ChevronDown, Check, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

const cities = [
  { id: 'singapore', name: 'Singapore', flag: '🇸🇬' },
  { id: 'jakarta', name: 'Jakarta', flag: '🇮🇩' },
  { id: 'bangkok', name: 'Bangkok', flag: '🇹🇭' },
  { id: 'all', name: 'All Cities', flag: '🌏' },
]

export function MobileHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedCity, setSelectedCity] = useState(cities[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsDropdownOpen(true)
        setHighlightedIndex(cities.findIndex(c => c.id === selectedCity.id))
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsDropdownOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % cities.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + cities.length) % cities.length)
        break
      case 'Home':
        e.preventDefault()
        setHighlightedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setHighlightedIndex(cities.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleCitySelect(cities[highlightedIndex])
        break
      case 'Tab':
        setIsDropdownOpen(false)
        break
    }
  }, [isDropdownOpen, highlightedIndex, selectedCity.id])

  // Focus management when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setHighlightedIndex(cities.findIndex(c => c.id === selectedCity.id))
    }
  }, [isDropdownOpen, selectedCity.id])

  const handleCitySelect = (city: typeof cities[0]) => {
    setSelectedCity(city)
    setIsDropdownOpen(false)
    buttonRef.current?.focus()
    // TODO: Filter events by city
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 md:hidden
        transition-all duration-250
        ${isScrolled
          ? 'bg-white/95 backdrop-blur-lg border-b border-neutral-200'
          : 'bg-transparent'
        }
      `}
    >
      {/* Safe area for notch */}
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo - clean, minimal */}
          <div className="flex items-center gap-2">
            <Logo size={24} variant={isScrolled ? 'default' : 'white'} />
            <span className={`font-semibold text-lg tracking-tight transition-colors ${isScrolled ? 'text-neutral-900' : 'text-white'}`}>
              sweatbuddies
            </span>
          </div>

          {/* Right side: City Selector + Login/Profile */}
          <div className="flex items-center gap-2">
          {/* City Selector Dropdown - accessible */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={buttonRef}
              onClick={toggleDropdown}
              onKeyDown={handleKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-label={`Select city, current: ${selectedCity.name}`}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2
                ${isScrolled
                  ? 'bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20'
                }
              `}
            >
              <span>{selectedCity.flag}</span>
              <span className={isScrolled ? 'text-neutral-900' : 'text-white'}>{selectedCity.name}</span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className={`w-4 h-4 ${isScrolled ? 'text-neutral-400' : 'text-white/70'}`} />
              </motion.div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  ref={listboxRef}
                  role="listbox"
                  aria-label="Select a city"
                  aria-activedescendant={`city-${cities[highlightedIndex].id}`}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onKeyDown={handleKeyDown}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden z-50"
                >
                  {cities.map((city, index) => (
                    <button
                      key={city.id}
                      id={`city-${city.id}`}
                      role="option"
                      aria-selected={selectedCity.id === city.id}
                      onClick={() => handleCitySelect(city)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-left
                        transition-colors border-b border-neutral-100 last:border-b-0
                        ${highlightedIndex === index ? 'bg-neutral-100' : ''}
                        ${selectedCity.id === city.id
                          ? 'text-neutral-900 font-semibold'
                          : 'text-neutral-600'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        <span>{city.flag}</span>
                        <span>{city.name}</span>
                      </span>
                      {selectedCity.id === city.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="w-4 h-4 text-neutral-900" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Login/Profile Button */}
          {isLoaded && (
            <Link
              href={isSignedIn ? '/profile' : '/sign-in'}
              aria-label={isSignedIn ? 'Profile' : 'Sign in'}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full
                transition-all duration-200
                ${isScrolled
                  ? 'bg-white border border-neutral-200 hover:border-neutral-400'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20'
                }
              `}
            >
              <User className={`w-5 h-5 ${isScrolled ? 'text-neutral-700' : 'text-white'}`} />
            </Link>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
