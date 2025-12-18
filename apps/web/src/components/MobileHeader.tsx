'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Logo } from '@/components/logo'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleCitySelect = (city: typeof cities[0]) => {
    setSelectedCity(city)
    setIsDropdownOpen(false)
    // TODO: Filter events by city
  }

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40 md:hidden
        transition-all duration-250
        ${isScrolled
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200'
          : 'bg-transparent'
        }
      `}
    >
      {/* Safe area for notch */}
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-semibold text-lg tracking-tight">
              <span className="text-primary">SWEAT</span>
              <span className="text-gray-800">BUDDIES</span>
            </span>
          </div>

          {/* City Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full border border-gray-200 text-sm font-medium transition-all hover:border-gray-400"
            >
              <span>{selectedCity.flag}</span>
              <span className="text-gray-800">{selectedCity.name}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left
                      transition-colors border-b border-gray-100 last:border-b-0
                      ${selectedCity.id === city.id
                        ? 'bg-gray-50 text-gray-800 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span>{city.flag}</span>
                      <span>{city.name}</span>
                    </span>
                    {selectedCity.id === city.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
