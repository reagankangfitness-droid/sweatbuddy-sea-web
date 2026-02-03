'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'
import { safeSetJSON, safeRemove } from '@/lib/safe-storage'

interface Activity {
  city: string
  type: string
}

const CITY_EMOJI_MAP: Record<string, string> = {
  'singapore': '🇸🇬',
  'bangkok': '🇹🇭',
  'krung thep maha nakhon': '🇹🇭',
  'kuala lumpur': '🇲🇾',
  'kl': '🇲🇾',
  'manila': '🇵🇭',
  'jakarta': '🇮🇩',
  'ho chi minh city': '🇻🇳',
  'hcmc': '🇻🇳',
  'hanoi': '🇻🇳',
  'bali': '🇮🇩',
  'phuket': '🇹🇭',
  'chiang mai': '🇹🇭',
  'thailand': '🇹🇭',
}

// Normalize city names - extract just the city from full addresses
const normalizeCityName = (city: string): string => {
  const cityLower = city.toLowerCase().trim()

  // Direct matches for known cities
  if (cityLower.includes('singapore')) return 'Singapore'
  if (cityLower.includes('bangkok') || cityLower.includes('krung thep')) return 'Bangkok'
  if (cityLower.includes('kuala lumpur') || cityLower === 'kl') return 'Kuala Lumpur'
  if (cityLower.includes('manila')) return 'Manila'
  if (cityLower.includes('jakarta')) return 'Jakarta'
  if (cityLower.includes('ho chi minh') || cityLower === 'hcmc') return 'Ho Chi Minh City'
  if (cityLower.includes('hanoi')) return 'Hanoi'
  if (cityLower.includes('bali')) return 'Bali'
  if (cityLower.includes('phuket')) return 'Phuket'
  if (cityLower.includes('chiang mai')) return 'Chiang Mai'
  if (cityLower.includes('thailand')) return 'Thailand'

  // If it's a long address (contains comma or is too long), try to extract city
  if (city.includes(',')) {
    // Take the first part before comma, or look for known city names
    const parts = city.split(',').map(p => p.trim())
    for (const part of parts) {
      const normalized = normalizeCityName(part)
      if (normalized !== part) return normalized
    }
    // If no known city found, return first meaningful part
    return parts[0].length > 30 ? 'Other' : parts[0]
  }

  // If it's too long (likely an address), return 'Other'
  if (city.length > 30) return 'Other'

  return city
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Types', emoji: '✨' },
  { value: 'RUN', label: 'Run', emoji: '🏃' },
  { value: 'GYM', label: 'Gym', emoji: '💪' },
  { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
  { value: 'HIKE', label: 'Hike', emoji: '🥾' },
  { value: 'CYCLING', label: 'Cycling', emoji: '🚴' },
  { value: 'COMBAT', label: 'Combat', emoji: '🥊' },
  { value: 'SWIM', label: 'Swim', emoji: '🏊' },
  { value: 'SPORTS', label: 'Sports', emoji: '🏀' },
  { value: 'OTHER', label: 'Other', emoji: '✨' },
]

interface ActivityFilterProps {
  activities: Activity[]
  selectedCity: string
  selectedType: string
  onCityChange: (city: string) => void
  onTypeChange: (type: string) => void
}

interface FilterDropdownProps {
  label: string
  options: Array<{ value: string; label: string; emoji: string }>
  selectedValue: string
  onSelect: (value: string) => void
  placeholder: string
}

function FilterDropdown({ label, options, selectedValue, onSelect, placeholder }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent body scroll when mobile dropdown is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth <= 767) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === selectedValue)
  const hasSelection = selectedValue && selectedValue !== 'all'

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[99] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div ref={dropdownRef} className="relative">
        {/* Dropdown Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between gap-2 px-4 py-2.5 rounded-pill
            font-medium transition-all duration-200 border
            ${hasSelection
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-white text-foreground border-border hover:border-foreground/40'
            }
            ${isOpen && !hasSelection ? 'border-primary ring-1 ring-primary' : ''}
            w-full md:w-auto md:min-w-[180px]
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          style={{ fontSize: '14px' }}
        >
          <span className="flex items-center gap-2">
            {selectedOption ? (
              <>
                <span role="img" aria-label={selectedOption.label} style={{ fontSize: '16px' }}>
                  {selectedOption.emoji}
                </span>
                <span>{selectedOption.label}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </span>

          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Panel - Desktop */}
        {isOpen && (
          <div
            className={`
              hidden md:block
              absolute top-[calc(100%+8px)] left-0 min-w-[240px] max-h-[320px]
              bg-white border border-border rounded-2xl shadow-premium
              overflow-hidden z-[100]
              animate-in fade-in slide-in-from-top-2 duration-200
            `}
            role="listbox"
          >
            <div className="p-3 max-h-[320px] overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-1.5">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl
                      transition-all duration-150 text-left
                      ${selectedValue === option.value
                        ? 'bg-primary/10 border border-primary'
                        : 'border border-transparent hover:bg-muted'
                      }
                    `}
                    role="option"
                    aria-selected={selectedValue === option.value}
                    style={{ fontSize: '14px' }}
                  >
                    <span className="text-lg flex-shrink-0" role="img" aria-label={option.label}>
                      {option.emoji}
                    </span>
                    <span className={`flex-1 ${selectedValue === option.value ? 'font-semibold text-primary-dark' : 'font-medium text-foreground'}`}>
                      {option.label}
                    </span>
                    {selectedValue === option.value && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dropdown Panel - Mobile (Bottom Sheet) */}
        {isOpen && (
          <div
            className={`
              md:hidden
              fixed bottom-0 left-0 right-0
              bg-white rounded-t-3xl shadow-premium
              z-[100]
              max-h-[70vh]
              animate-in slide-in-from-bottom duration-300
            `}
            role="listbox"
          >
            {/* Mobile Handle */}
            <div className="pt-3 pb-2 flex justify-center">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Mobile Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-border">
              <h3 className="font-sans font-semibold text-foreground" style={{ fontSize: '18px' }}>
                {label}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="p-5 pb-8 max-h-[calc(70vh-80px)] overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex items-center gap-4 w-full px-4 py-3.5 rounded-xl
                      transition-all duration-150 text-left
                      ${selectedValue === option.value
                        ? 'bg-primary/10 border border-primary'
                        : 'border border-transparent hover:bg-muted'
                      }
                    `}
                    role="option"
                    aria-selected={selectedValue === option.value}
                    style={{ fontSize: '15px' }}
                  >
                    <span className="text-2xl flex-shrink-0" role="img" aria-label={option.label}>
                      {option.emoji}
                    </span>
                    <span className={`flex-1 ${selectedValue === option.value ? 'font-semibold text-primary-dark' : 'font-medium text-foreground'}`}>
                      {option.label}
                    </span>
                    {selectedValue === option.value && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function ActivityFilter({
  activities = [],
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange
}: ActivityFilterProps) {
  // Extract unique cities from activities and normalize them
  const normalizedCities = (activities || [])
    .map(a => a.city)
    .filter(Boolean)
    .map(normalizeCityName)
  const uniqueCities = ['all', ...new Set(normalizedCities)]
  const cityOptions = uniqueCities.map(city => ({
    value: city.toLowerCase().replace(/\s+/g, '-'),
    label: city === 'all' ? 'All Cities' : city,
    emoji: city === 'all' ? '🌏' : CITY_EMOJI_MAP[city.toLowerCase()] || '🌏'
  }))

  const handleCitySelect = (cityValue: string) => {
    onCityChange(cityValue)
    // Persist to localStorage
    if (cityValue === 'all') {
      safeRemove('selectedCity')
    } else {
      safeSetJSON('selectedCity', cityValue)
    }
  }

  const handleTypeSelect = (typeValue: string) => {
    onTypeChange(typeValue)
    if (typeValue === 'all') {
      safeRemove('selectedType')
    } else {
      safeSetJSON('selectedType', typeValue)
    }
  }

  const hasActiveFilters = selectedCity !== 'all' || selectedType !== 'all'

  return (
    <div className="space-y-4">
      {/* Filter Dropdowns Row */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <FilterDropdown
          label="City"
          options={cityOptions}
          selectedValue={selectedCity}
          onSelect={handleCitySelect}
          placeholder="Select City"
        />

        <FilterDropdown
          label="Activity Type"
          options={ACTIVITY_TYPES}
          selectedValue={selectedType}
          onSelect={handleTypeSelect}
          placeholder="Select Activity"
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              handleCitySelect('all')
              handleTypeSelect('all')
            }}
            className="px-4 py-2.5 rounded-lg font-medium text-primary-dark hover:bg-primary/10 transition-colors duration-200 md:ml-auto"
            style={{ fontSize: '13px' }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export { ActivityFilter as CityFilter }
