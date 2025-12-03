'use client'

import { useState, useRef, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api'
import { Send, Check, MapPin, Loader2 } from 'lucide-react'
import { SectionGradient } from './GradientBackground'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const categories = [
  // Cardio & Endurance
  { value: 'Running', label: 'Running' },
  { value: 'Run Club', label: 'Run Club' },
  { value: 'Cycling', label: 'Cycling' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'Swimming', label: 'Swimming' },
  { value: 'Dance Fitness', label: 'Dance Fitness' },
  { value: 'Jump Rope', label: 'Jump Rope' },

  // Strength & Power
  { value: 'Strength Training', label: 'Strength Training' },
  { value: 'Bootcamp', label: 'Bootcamp' },
  { value: 'CrossFit', label: 'CrossFit' },
  { value: 'Hyrox', label: 'Hyrox' },
  { value: 'Functional Fitness', label: 'Functional Fitness' },
  { value: 'Calisthenics', label: 'Calisthenics' },

  // Mind & Body
  { value: 'Yoga', label: 'Yoga' },
  { value: 'Pilates', label: 'Pilates' },
  { value: 'Breathwork', label: 'Breathwork' },
  { value: 'Meditation', label: 'Meditation' },
  { value: 'Tai Chi', label: 'Tai Chi' },
  { value: 'Stretching', label: 'Stretching' },

  // Outdoor & Adventure
  { value: 'Hiking', label: 'Hiking' },
  { value: 'Climbing', label: 'Climbing' },
  { value: 'Outdoor Fitness', label: 'Outdoor Fitness' },
  { value: 'Beach Workout', label: 'Beach Workout' },
  { value: 'Trail Running', label: 'Trail Running' },

  // Sports
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Pickleball', label: 'Pickleball' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Badminton', label: 'Badminton' },
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Soccer', label: 'Soccer' },
  { value: 'Frisbee', label: 'Frisbee' },

  // Recovery & Wellness
  { value: 'Cold Plunge', label: 'Cold Plunge' },
  { value: 'Sauna', label: 'Sauna' },
  { value: 'Sound Bath', label: 'Sound Bath' },
  { value: 'Massage', label: 'Massage' },
  { value: 'Wellness Circle', label: 'Wellness Circle' },

  // Social & Community
  { value: 'Fitness Social', label: 'Fitness Social' },
  { value: 'Sweat Date', label: 'Sweat Date' },
  { value: 'Corporate Wellness', label: 'Corporate Wellness' },

  // Skills & Learning
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Retreat', label: 'Retreat' },
  { value: 'Fitness Festival', label: 'Fitness Festival' },
  { value: 'Nutrition', label: 'Nutrition' },
  { value: 'Coaching', label: 'Coaching' },

  // Other
  { value: 'Other', label: 'Other' },
]

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: {
    country: ['sg', 'th', 'id', 'my', 'ph', 'vn'],
  },
  types: ['establishment', 'geocode'],
  fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
}

const DEFAULT_CENTER = {
  lat: 1.3521,
  lng: 103.8198,
}

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '200px',
  borderRadius: '12px',
}

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  ],
}

const LIBRARIES: ('places')[] = ['places']

export function SubmitForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

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
          ['establishment', 'point_of_interest', 'gym', 'park', 'museum', 'restaurant', 'cafe', 'stadium', 'health'].includes(type)
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

      setLocationData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }))
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      eventName: formData.get('eventName'),
      category: formData.get('category'),
      day: formData.get('day'),
      time: formData.get('time'),
      recurring: formData.get('recurring') === 'on',
      location: locationData.location || formData.get('location'),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      placeId: locationData.placeId,
      description: formData.get('description'),
      organizerName: formData.get('organizerName'),
      organizerInstagram: formData.get('organizerInstagram'),
      contactEmail: formData.get('contactEmail'),
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
      <section id="submit" className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] to-[#0A0F18]" />
        <SectionGradient />

        <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
          <div className="max-w-md mx-auto text-center">
            <div className="glass-card rounded-2xl p-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#3CCFBB]/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-[#3CCFBB]" />
              </div>
              <h2 className="font-heading font-bold text-white text-2xl mb-3 tracking-wide">
                Thanks for submitting!
              </h2>
              <p className="font-body text-white/50">
                We&apos;ll review your event and feature it within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="submit" className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] to-[#0A0F18]" />
      <SectionGradient />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3CCFBB]/10 border border-[#3CCFBB]/20 text-[#3CCFBB] text-sm font-medium mb-6">
              <Send className="w-4 h-4" />
              <span>Free Listing</span>
            </div>
            <h2
              className="font-heading font-extrabold text-white mb-4 tracking-wide"
              style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}
            >
              Submit Your <span className="text-gradient">Event</span>
            </h2>
            <p className="font-body text-white/50">
              We review submissions within 48 hours.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="eventName" className="block text-sm font-body font-medium text-white/80 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                required
                className="w-full h-12 px-4 rounded-xl input-dark"
                placeholder="e.g., Sunrise Run @ East Coast"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-body font-medium text-white/80 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full h-12 px-4 rounded-xl input-dark"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Day and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="day" className="block text-sm font-body font-medium text-white/80 mb-2">
                  Day *
                </label>
                <input
                  type="text"
                  id="day"
                  name="day"
                  required
                  className="w-full h-12 px-4 rounded-xl input-dark"
                  placeholder="e.g., Saturdays"
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-body font-medium text-white/80 mb-2">
                  Time *
                </label>
                <input
                  type="text"
                  id="time"
                  name="time"
                  required
                  className="w-full h-12 px-4 rounded-xl input-dark"
                  placeholder="e.g., 6:30 AM"
                />
              </div>
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                name="recurring"
                className="w-5 h-5 rounded bg-white/5 border-white/20 text-[#3CCFBB] focus:ring-[#3CCFBB] focus:ring-offset-0"
              />
              <label htmlFor="recurring" className="text-sm font-body text-white/70">
                This is a recurring event
              </label>
            </div>

            {/* Location with Google Places */}
            <div>
              <label htmlFor="location" className="block text-sm font-body font-medium text-white/80 mb-2">
                Location *
              </label>
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
                <div className="space-y-3">
                  <Autocomplete
                    onLoad={onLoad}
                    onPlaceChanged={onPlaceChanged}
                    options={AUTOCOMPLETE_OPTIONS}
                  >
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        value={locationData.location}
                        onChange={(e) => setLocationData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full h-12 pl-12 pr-4 rounded-xl input-dark"
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
                    {markerPosition && (
                      <Marker position={markerPosition} />
                    )}
                  </GoogleMap>

                  <p className="text-xs text-white/40">
                    Search for a venue or click on the map to pin location
                  </p>
                </div>
              </LoadScript>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-body font-medium text-white/80 mb-2">
                Description (150 chars max)
              </label>
              <textarea
                id="description"
                name="description"
                maxLength={150}
                rows={3}
                className="w-full px-4 py-3 rounded-xl input-dark resize-none"
                placeholder="e.g., 5K group run. All paces welcome."
              />
            </div>

            {/* Organizer Name */}
            <div>
              <label htmlFor="organizerName" className="block text-sm font-body font-medium text-white/80 mb-2">
                Organizer Name *
              </label>
              <input
                type="text"
                id="organizerName"
                name="organizerName"
                required
                className="w-full h-12 px-4 rounded-xl input-dark"
                placeholder="Your name or crew name"
              />
            </div>

            {/* Organizer Instagram */}
            <div>
              <label htmlFor="organizerInstagram" className="block text-sm font-body font-medium text-white/80 mb-2">
                Instagram Handle *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                <input
                  type="text"
                  id="organizerInstagram"
                  name="organizerInstagram"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl input-dark"
                  placeholder="yourhandle"
                />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-body font-medium text-white/80 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                required
                className="w-full h-12 px-4 rounded-xl input-dark"
                placeholder="your@email.com"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary h-14 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Submit Event</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
