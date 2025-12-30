'use client'

import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { Send, Check, MapPin, Loader2, X, ImageIcon, ChevronRight, ChevronLeft } from 'lucide-react'
import { SectionGradient } from './GradientBackground'
import { UploadButton } from '@/lib/uploadthing'
import Image from 'next/image'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const categories = [
  { value: 'Running', label: 'Running' },
  { value: 'Run Club', label: 'Run Club' },
  { value: 'Cycling', label: 'Cycling' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'Swimming', label: 'Swimming' },
  { value: 'Dance Fitness', label: 'Dance Fitness' },
  { value: 'Strength Training', label: 'Strength Training' },
  { value: 'Bootcamp', label: 'Bootcamp' },
  { value: 'CrossFit', label: 'CrossFit' },
  { value: 'Yoga', label: 'Yoga' },
  { value: 'Pilates', label: 'Pilates' },
  { value: 'Breathwork', label: 'Breathwork' },
  { value: 'Meditation', label: 'Meditation' },
  { value: 'Hiking', label: 'Hiking' },
  { value: 'Outdoor Fitness', label: 'Outdoor Fitness' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Pickleball', label: 'Pickleball' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Cold Plunge', label: 'Cold Plunge' },
  { value: 'Wellness Circle', label: 'Wellness Circle' },
  { value: 'Other', label: 'Other' },
]

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: ['sg', 'th', 'id', 'my', 'ph', 'vn'] },
  types: ['establishment', 'geocode'],
  fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
}

const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }

const MAP_CONTAINER_STYLE = { width: '100%', height: '180px', borderRadius: '12px' }

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    // Clean, minimal light theme with better readability
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f6' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffd54f' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c8e6c9' }] },
  ],
}

const LIBRARIES: ('places')[] = ['places']

const STEPS = [
  { id: 1, title: 'The Basics', description: 'Name, category, date & time' },
  { id: 2, title: 'Location', description: 'Where should people meet?' },
  { id: 3, title: 'Your Info', description: 'Contact & image' },
]

// Debounced input component - handles local state to prevent parent re-renders
const DebouncedInput = memo(function DebouncedInput({
  value,
  onChange,
  debounceMs = 150,
  className,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local value when parent value changes (e.g., form reset)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue) // Update local state immediately for responsive UI

    // Debounce the parent state update
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }, [onChange, debounceMs])

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      className={className}
    />
  )
})

// Debounced textarea component
const DebouncedTextarea = memo(function DebouncedTextarea({
  value,
  onChange,
  debounceMs = 150,
  className,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }, [onChange, debounceMs])

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      className={className}
    />
  )
})

export function SubmitForm() {
  // Load Google Maps API once at component mount
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    eventName: '',
    category: '',
    eventDate: '',
    time: '',
    recurring: true,
    description: '',
    organizerName: '',
    organizerInstagram: '',
    contactEmail: '',
    communityLink: '',
    // Pricing fields
    isFree: true,
    price: '',
    stripeEnabled: false,
  })

  // Location state
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [locationData, setLocationData] = useState({
    location: '',
    latitude: 0,
    longitude: 0,
    placeId: '',
  })

  const updateFormData = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const newPosition = { lat, lng }
        setMapCenter(newPosition)
        setMarkerPosition(newPosition)

        const isEstablishment = place.types?.some(type =>
          ['establishment', 'point_of_interest', 'gym', 'park'].includes(type)
        )
        const displayAddress = isEstablishment && place.name
          ? `${place.name}, ${place.formatted_address || ''}`
          : place.formatted_address || ''

        setLocationData({
          location: displayAddress,
          latitude: lat,
          longitude: lng,
          placeId: place.place_id || '',
        })
      }
    }
  }

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const newPosition = { lat, lng }
      setMarkerPosition(newPosition)
      setMapCenter(newPosition)
      setLocationData(prev => ({ ...prev, latitude: lat, longitude: lng }))
    }
  }, [])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.eventName && formData.category && formData.eventDate && formData.time)
      case 2:
        return !!(locationData.location)
      case 3:
        return !!(formData.organizerName && formData.organizerInstagram && formData.contactEmail)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
      setError('')
    } else {
      setError('Don\'t forget to fill in all the required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  async function handleSubmit() {
    // Validate step 3 first
    if (!validateStep(3)) {
      setError('Almost there! Fill in the remaining fields to submit')
      return
    }

    // Also validate that earlier steps have data
    if (!formData.eventName || !formData.category || !formData.time) {
      setError('Missing event details—go back and fill in Event Name, Category, and Time')
      return
    }

    if (!locationData.location) {
      setError('Where\'s this happening? Go back and add a location')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const eventDate = formData.eventDate ? new Date(formData.eventDate + 'T00:00:00') : null
      const dayName = eventDate && !isNaN(eventDate.getTime())
        ? eventDate.toLocaleDateString('en-US', { weekday: 'long' }) + 's'
        : 'Weekly'

      const data = {
        eventName: formData.eventName,
        category: formData.category,
        day: dayName || 'Weekly',
        eventDate: formData.eventDate || null,
        time: formData.time,
        recurring: formData.recurring,
        location: locationData.location,
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        placeId: locationData.placeId || null,
        description: formData.description || null,
        imageUrl: imageUrl || null,
        organizerName: formData.organizerName,
        organizerInstagram: formData.organizerInstagram,
        contactEmail: formData.contactEmail,
        communityLink: formData.communityLink || null,
        // Pricing
        isFree: formData.isFree,
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        stripeEnabled: !formData.isFree && formData.stripeEnabled,
      }

      console.log('[SubmitForm] Submitting:', JSON.stringify(data))

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log('[SubmitForm] Response:', response.status, JSON.stringify(result))

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('[SubmitForm] Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section className="relative py-20 md:py-32 overflow-hidden bg-neutral-50">
        <SectionGradient />
        <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl p-10 shadow-card border border-neutral-100">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-sans font-bold text-neutral-900 text-2xl mb-3">
                Your event is live! 🎉
              </h2>
              <p className="font-sans text-neutral-600 mb-6">
                <span className="font-medium text-neutral-900">{formData.eventName}</span> is now on SweatBuddies. We&apos;ll email you at <span className="font-medium text-neutral-900">{formData.contactEmail}</span> once it&apos;s approved.
              </p>
              <div className="pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-600 mb-3">
                  Want to manage your events and see who&apos;s coming?
                </p>
                <a
                  href="/organizer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-medium rounded-full hover:bg-neutral-900-600 transition shadow-md"
                >
                  Go to Host Dashboard
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-neutral-50">
      <SectionGradient />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/10 border border-neutral-900/20 text-neutral-900 text-sm font-medium mb-6">
              <Send className="w-4 h-4" />
              <span>Free Listing</span>
            </div>
            <h2
              className="font-sans font-bold text-neutral-900 mb-4"
              style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-0.02em' }}
            >
              Submit Your <span className="text-neutral-900">Event</span>
            </h2>
          </div>

          {/* Free Forever Reassurance */}
          <div className="text-center mb-10">
            <p className="font-sans font-semibold text-neutral-900 text-lg mb-1">
              100% Free. No Catches.
            </p>
            <p className="font-sans text-neutral-500 text-sm">
              No listing fees. No commissions. No &quot;freemium&quot; upsells. Free while we grow.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-sans font-bold text-sm transition-all ${
                      currentStep >= step.id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep >= step.id ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step.id ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-neutral-100">
            {/* Step 1: Event Details */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Event name *
                  </label>
                  <DebouncedInput
                    type="text"
                    value={formData.eventName}
                    onChange={(val) => updateFormData('eventName', val)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                    placeholder="e.g., Sunrise Run at East Coast"
                  />
                  <span className="text-xs text-neutral-400 mt-1 block">Keep it short and clear</span>
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    What kind of workout? *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                  >
                    <option value="">Pick a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => updateFormData('eventDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                      Time *
                    </label>
                    <DebouncedInput
                      type="text"
                      value={formData.time}
                      onChange={(val) => updateFormData('time', val)}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                      placeholder="e.g., 6:30 AM"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={(e) => updateFormData('recurring', e.target.checked)}
                    className="w-5 h-5 rounded bg-white border-neutral-200 text-neutral-900 focus:ring-neutral-900/30"
                  />
                  <label htmlFor="recurring" className="text-sm font-sans text-neutral-600">
                    This event repeats weekly
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Where&apos;s it happening? *
                  </label>
                  {mapsLoaded ? (
                    <div className="space-y-3">
                      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} options={AUTOCOMPLETE_OPTIONS}>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            defaultValue={locationData.location}
                            onChange={(e) => setLocationData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                            placeholder="e.g., East Coast Park, Carpark C"
                          />
                        </div>
                      </Autocomplete>

                      <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={mapCenter}
                        zoom={markerPosition ? 15 : 11}
                        onClick={onMapClick}
                        options={MAP_OPTIONS}
                      >
                        {markerPosition && <Marker position={markerPosition} />}
                      </GoogleMap>

                      <p className="text-xs text-neutral-400">
                        Be specific so people can find you
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        defaultValue={locationData.location}
                        onChange={(e) => setLocationData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                        placeholder="e.g., East Coast Park, Carpark C"
                      />
                      <span className="text-xs text-neutral-400 mt-1 block">Be specific so people can find you</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Tell people what to expect
                  </label>
                  <DebouncedTextarea
                    value={formData.description}
                    onChange={(val) => updateFormData('description', val)}
                    maxLength={150}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20 resize-none"
                    placeholder="What's the vibe? What should people bring?"
                  />
                  <span className="text-xs text-neutral-400 mt-1 block text-right">
                    {formData.description.length}/150
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Organizer Info */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Event Image (optional)
                  </label>
                  {imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100">
                      <Image src={imageUrl} alt="Event preview" width={400} height={160} className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900/80 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white border border-neutral-200 border-dashed p-5">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-neutral-500">
                          <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8 text-neutral-900" />
                          <UploadButton
                            endpoint="eventImage"
                            onUploadBegin={() => setIsUploading(true)}
                            onClientUploadComplete={(res) => {
                              setIsUploading(false)
                              if (res?.[0]?.url) setImageUrl(res[0].url)
                            }}
                            onUploadError={(error: Error) => {
                              setIsUploading(false)
                              setError(`Upload failed: ${error.message}`)
                            }}
                            appearance={{
                              button: "bg-neutral-900 hover:bg-neutral-900-600 text-white font-medium px-4 py-2 rounded-full text-sm transition-colors",
                              allowedContent: "hidden",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Your name or community name *
                  </label>
                  <DebouncedInput
                    type="text"
                    value={formData.organizerName}
                    onChange={(val) => updateFormData('organizerName', val)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                    placeholder="e.g., RunSG or Sarah Chen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Your Instagram handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                    <DebouncedInput
                      type="text"
                      value={formData.organizerInstagram}
                      onChange={(val) => updateFormData('organizerInstagram', val)}
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                      placeholder="yourhandle"
                    />
                  </div>
                  <span className="text-xs text-neutral-400 mt-1 block">So people can find and follow you</span>
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Your email *
                  </label>
                  <DebouncedInput
                    type="email"
                    value={formData.contactEmail}
                    onChange={(val) => updateFormData('contactEmail', val)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                    placeholder="you@example.com"
                  />
                  <span className="text-xs text-neutral-400 mt-1 block">We&apos;ll send event updates here</span>
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                    Community group link
                  </label>
                  <DebouncedInput
                    type="url"
                    value={formData.communityLink}
                    onChange={(val) => updateFormData('communityLink', val)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                    placeholder="e.g., https://chat.whatsapp.com/..."
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    WhatsApp or Telegram group for attendees to join
                  </p>
                </div>

                {/* Pricing Section */}
                <div className="pt-4 border-t border-neutral-200 space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Pricing</h3>

                  {/* Free or Paid Toggle */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isFree"
                        checked={formData.isFree}
                        onChange={() => setFormData(prev => ({ ...prev, isFree: true }))}
                        className="w-4 h-4 text-neutral-900"
                      />
                      <span className="text-neutral-700">Free event</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isFree"
                        checked={!formData.isFree}
                        onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                        className="w-4 h-4 text-neutral-900"
                      />
                      <span className="text-neutral-700">Paid event</span>
                    </label>
                  </div>

                  {/* Paid Event Options */}
                  {!formData.isFree && (
                    <div className="space-y-4">
                      {/* Price Input */}
                      <div>
                        <label className="block text-sm font-sans font-medium text-neutral-900 mb-2">
                          Price (SGD) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                          <DebouncedInput
                            type="number"
                            min={1}
                            step={0.01}
                            value={formData.price}
                            onChange={(val) => updateFormData('price', val)}
                            placeholder="15.00"
                            className="w-full h-12 pl-8 pr-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
                          />
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-neutral-700">Payment method</p>

                        {/* Card payments via Stripe */}
                        <label className="flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.stripeEnabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, stripeEnabled: e.target.checked }))}
                            className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-neutral-900"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">Card payments</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Stripe</span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-0.5">Accept credit/debit cards - funds go directly to your bank</p>
                          </div>
                        </label>

                        {/* Stripe info */}
                        {formData.stripeEnabled && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800">
                              <strong>How it works:</strong> After your event is approved, you&apos;ll complete a quick Stripe setup to connect your bank account. Payments go directly to you with a 5% platform fee.
                            </p>
                          </div>
                        )}

                        {/* Fee Notice */}
                        {formData.stripeEnabled && (
                          <p className="text-xs text-neutral-400">
                            5% platform fee + Stripe processing fees (~2.9% + $0.30).
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 h-12 rounded-full border border-neutral-200 text-neutral-700 font-semibold flex items-center justify-center gap-2 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-12 rounded-full bg-neutral-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-neutral-900-600 transition-colors shadow-md"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-full bg-neutral-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-neutral-900-600 transition-colors disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Event
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
