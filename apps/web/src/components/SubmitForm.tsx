'use client'

import { useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api'
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
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  ],
}

const LIBRARIES: ('places')[] = ['places']

const STEPS = [
  { id: 1, title: 'Event Details', description: 'Name, category, date & time' },
  { id: 2, title: 'Location', description: 'Where is it happening?' },
  { id: 3, title: 'Organizer', description: 'Your info & image' },
]

export function SubmitForm() {
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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
      setError('Please fill in all required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  async function handleSubmit() {
    if (!validateStep(3)) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError('')

    const eventDate = formData.eventDate ? new Date(formData.eventDate + 'T00:00:00') : null
    const dayName = eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'long' }) + 's' : ''

    const data = {
      eventName: formData.eventName,
      category: formData.category,
      day: dayName,
      eventDate: formData.eventDate,
      time: formData.time,
      recurring: formData.recurring,
      location: locationData.location,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      placeId: locationData.placeId,
      description: formData.description,
      imageUrl: imageUrl,
      organizerName: formData.organizerName,
      organizerInstagram: formData.organizerInstagram,
      contactEmail: formData.contactEmail,
    }

    try {
      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to submit')
      setIsSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section id="submit" className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(52, 119, 248, 0.04) 0%, transparent 60%)' }} />
        <SectionGradient />
        <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[#f7faff] rounded-2xl p-10 shadow-sm border border-[#e8eef5]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-heading font-bold text-[#0d1520] text-2xl mb-3 tracking-wide">
                Thanks for submitting!
              </h2>
              <p className="font-body text-[#5a6b7a] mb-6">
                We&apos;ll review your event and email you at <span className="font-medium text-[#0d1520]">{formData.contactEmail}</span> within 24 hours.
              </p>
              <div className="pt-4 border-t border-[#e8eef5]">
                <p className="text-sm text-[#5a6b7a] mb-3">
                  Want to manage your events and see who&apos;s attending?
                </p>
                <a
                  href="/organizer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3477f8] text-white font-medium rounded-lg hover:bg-[#2563eb] transition"
                >
                  Access Host Dashboard
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
    <section id="submit" className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(52, 119, 248, 0.04) 0%, transparent 60%)' }} />
      <SectionGradient />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3477f8]/10 border border-[#3477f8]/20 text-[#3477f8] text-sm font-medium mb-6">
              <Send className="w-4 h-4" />
              <span>Free Listing</span>
            </div>
            <h2
              className="font-heading font-extrabold text-[#0d1520] mb-4 tracking-wide"
              style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}
            >
              Submit Your <span className="text-gradient-warm">Event</span>
            </h2>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all ${
                      currentStep >= step.id
                        ? 'bg-[#3477f8] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep >= step.id ? 'text-[#3477f8]' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step.id ? 'bg-[#3477f8]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-[#f7faff] rounded-2xl p-6 md:p-8 shadow-sm border border-[#e8eef5]">
            {/* Step 1: Event Details */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => updateFormData('eventName', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
                    placeholder="e.g., Sunrise Run @ East Coast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] focus:outline-none focus:border-[#3477f8]"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => updateFormData('eventDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] focus:outline-none focus:border-[#3477f8]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                      Time *
                    </label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => updateFormData('time', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
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
                    className="w-5 h-5 rounded bg-white border-[#e0e7ef] text-[#3477f8] focus:ring-[#3477f8]/30"
                  />
                  <label htmlFor="recurring" className="text-sm font-body text-[#3d4f5f]">
                    This event repeats weekly
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Location *
                  </label>
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
                    <div className="space-y-3">
                      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} options={AUTOCOMPLETE_OPTIONS}>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6b7a]" />
                          <input
                            type="text"
                            value={locationData.location}
                            onChange={(e) => setLocationData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
                            placeholder="Search for a location..."
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

                      <p className="text-xs text-[#a0b0c0]">
                        Search for a venue or click on the map to pin location
                      </p>
                    </div>
                  </LoadScript>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    maxLength={150}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8] resize-none"
                    placeholder="e.g., 5K group run. All paces welcome."
                  />
                  <span className="text-xs text-gray-400 mt-1 block text-right">
                    {formData.description.length}/150
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Organizer Info */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Event Image (optional)
                  </label>
                  {imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-[#f0f4fa] border border-[#e8eef5]">
                      <Image src={imageUrl} alt="Event preview" width={400} height={160} className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white border border-[#e0e7ef] border-dashed p-5">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-[#5a6b7a]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#3477f8]" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8 text-[#3477f8]" />
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
                              button: "bg-[#3477f8] hover:bg-[#2563eb] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors",
                              allowedContent: "hidden",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.organizerName}
                    onChange={(e) => updateFormData('organizerName', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
                    placeholder="Your name or crew name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Instagram Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b7a]">@</span>
                    <input
                      type="text"
                      value={formData.organizerInstagram}
                      onChange={(e) => updateFormData('organizerInstagram', e.target.value)}
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
                      placeholder="yourhandle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-[#0d1520] mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e0e7ef] text-[#0d1520] placeholder:text-[#a0b0c0] focus:outline-none focus:border-[#3477f8]"
                    placeholder="your@email.com"
                  />
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
                  className="flex-1 h-12 rounded-xl border border-[#e0e7ef] text-[#3d4f5f] font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-12 rounded-xl bg-[#3477f8] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[#3477f8] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Submit Event
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
