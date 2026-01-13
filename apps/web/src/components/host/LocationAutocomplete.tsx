'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface LocationAutocompleteProps {
  value: string
  onChange: (location: string, lat?: number, lng?: number, placeId?: string) => void
  placeholder?: string
  hasError?: boolean
  required?: boolean
}

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      resolve()
      return
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  hasError = false,
  required = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setError('Maps API key not configured')
      setIsLoading(false)
      return
    }

    let mounted = true

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (mounted) {
          setMapsLoaded(true)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error('Google Maps load error:', err)
        if (mounted) {
          setError('Could not load location search')
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  // Initialize autocomplete when maps loaded and input available
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'sg' }, // Restrict to Singapore
        fields: ['formatted_address', 'geometry', 'place_id', 'name'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (place.formatted_address || place.name) {
          const locationName = place.name
            ? `${place.name}, ${place.formatted_address || ''}`
            : place.formatted_address || ''

          onChange(
            locationName.trim(),
            place.geometry?.location?.lat(),
            place.geometry?.location?.lng(),
            place.place_id
          )
        }
      })

      autocompleteRef.current = autocomplete
    } catch (err) {
      console.error('Autocomplete init error:', err)
      setError('Could not initialize location search')
    }
  }, [mapsLoaded, onChange])

  // Handle manual input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-10 py-3 bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 ${hasError ? 'border-red-500 bg-red-50' : 'border-neutral-200'}`}
        />
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
      </div>
    )
  }

  // Fallback to simple input if error
  if (error) {
    return (
      <div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            name="location"
            value={value}
            onChange={handleInputChange}
            placeholder="Enter location address"
            required={required}
            className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 ${hasError ? 'border-red-500 bg-red-50' : 'border-neutral-200'}`}
          />
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Location search unavailable. Please type the full address.
        </p>
      </div>
    )
  }

  // Google Places Autocomplete input
  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 ${hasError ? 'border-red-500 bg-red-50' : 'border-neutral-200'}`}
      />
    </div>
  )
}
