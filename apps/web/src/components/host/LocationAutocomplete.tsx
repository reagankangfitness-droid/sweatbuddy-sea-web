'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { MapPin, Loader2 } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const LIBRARIES: ('places')[] = ['places']

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: {
    country: ['sg', 'th', 'id', 'my', 'ph', 'vn'],
  },
  types: ['establishment', 'geocode'],
  fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
}

interface LocationData {
  location: string
  latitude: number
  longitude: number
  placeId: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (data: LocationData) => void
  onManualChange: (value: string) => void
  hasError?: boolean
  placeholder?: string
  variant?: 'dark' | 'light'
}

export function LocationAutocomplete({
  value,
  onChange,
  onManualChange,
  hasError = false,
  placeholder = 'Add location',
  variant = 'dark',
}: LocationAutocompleteProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        // For establishments, use place name + formatted address
        const isEstablishment = place.types?.some(type =>
          ['establishment', 'point_of_interest', 'gym', 'park', 'museum', 'restaurant', 'cafe', 'stadium', 'health'].includes(type)
        )

        const displayAddress = isEstablishment && place.name
          ? `${place.name}, ${place.formatted_address || ''}`
          : place.formatted_address || ''

        onChange({
          location: displayAddress,
          latitude: lat,
          longitude: lng,
          placeId: place.place_id || '',
        })
      }
    }
  }, [autocomplete, onChange])

  const isDark = variant === 'dark'
  const wrapperCls = isDark
    ? `flex items-center gap-3 px-4 py-3 bg-neutral-900 border rounded-xl focus-within:border-neutral-500 transition-colors ${hasError ? 'border-red-500' : 'border-neutral-700'}`
    : `flex items-center gap-3 px-3.5 py-2.5 bg-[#FFFBF8] border rounded-xl focus-within:border-black/[0.12] transition-colors ${hasError ? 'border-red-500' : 'border-black/[0.04]'}`
  const iconCls = isDark ? 'w-5 h-5 text-neutral-500 shrink-0' : 'w-4 h-4 text-[#71717A] shrink-0'
  const inputCls = isDark
    ? 'flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none'
    : 'flex-1 bg-transparent text-[#1A1A1A] text-sm placeholder:text-[#9A9AAA] focus:outline-none'

  // Show loading state
  if (!isLoaded) {
    return (
      <div className={wrapperCls}>
        <Loader2 className={`${iconCls} animate-spin`} />
        <span className={isDark ? 'text-neutral-500' : 'text-[#9A9AAA] text-sm'}>Loading location search...</span>
      </div>
    )
  }

  // If there's a load error or no API key, fall back to basic input
  if (loadError || !GOOGLE_MAPS_API_KEY) {
    return (
      <div className={wrapperCls}>
        <MapPin className={iconCls} />
        <input
          type="text"
          value={value}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      </div>
    )
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={AUTOCOMPLETE_OPTIONS}
    >
      <div className={wrapperCls}>
        <MapPin className={iconCls} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      </div>
    </Autocomplete>
  )
}
