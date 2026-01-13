'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { ArrowLeft, Calendar, MapPin, Clock, Instagram, Mail, User, FileText, Loader2, CheckCircle, Users, Sparkles, DollarSign, ImageIcon, X } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const LIBRARIES: ('places')[] = ['places']
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 } // Singapore

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: ['sg', 'th', 'id', 'my', 'ph', 'vn'] },
  types: ['establishment', 'geocode'],
  fields: ['formatted_address', 'geometry', 'name', 'place_id'],
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '180px', borderRadius: '12px' }

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f6' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c8e6c9' }] },
  ],
}

const eventTypes = [
  'Run Club',
  'Yoga',
  'HIIT',
  'Cold Plunge',
  'Bootcamp',
  'Cycling',
  'Swimming',
  'Strength Training',
  'Dance',
  'Martial Arts',
  'Other',
]

export default function HostApplicationPage() {
  const router = useRouter()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  // Load Google Maps API
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const [formInitialized, setFormInitialized] = useState(false)

  // Google Maps state
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null)

  const [isRecurring, setIsRecurring] = useState(true)
  const [formData, setFormData] = useState({
    organizerName: '',
    instagramHandle: '',
    email: '',
    eventName: '',
    eventType: '',
    eventDay: '',
    eventDate: '',
    eventTime: '',
    location: '',
    latitude: 0,
    longitude: 0,
    placeId: '',
    description: '',
    communityLink: '',
    // Pricing fields
    isFree: true,
    price: '',
    // PayNow fields
    paynowQrCode: '',
    paynowNumber: '',
  })

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.push('/sign-in?intent=host')
    }
  }, [authLoaded, isSignedIn, router])

  // Pre-fill form with user data once authenticated
  useEffect(() => {
    if (user && !formInitialized) {
      const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      const userEmail = user.primaryEmailAddress?.emailAddress || ''
      // Try to get instagram from user metadata or unsafeMetadata
      const userInstagram = (user.unsafeMetadata?.instagram as string) || ''

      setFormData(prev => ({
        ...prev,
        organizerName: userName || prev.organizerName,
        email: userEmail || prev.email,
        instagramHandle: userInstagram || prev.instagramHandle,
      }))
      setFormInitialized(true)
    }
  }, [user, formInitialized])

  // Show loading while checking auth
  if (!authLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Google Maps callbacks
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const onPlaceChanged = useCallback(() => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const newPosition = { lat, lng }
        setMapCenter(newPosition)
        setMarkerPosition(newPosition)

        const displayAddress = place.name && place.formatted_address
          ? `${place.name}, ${place.formatted_address}`
          : place.formatted_address || place.name || ''

        setFormData(prev => ({
          ...prev,
          location: displayAddress,
          latitude: lat,
          longitude: lng,
          placeId: place.place_id || '',
        }))
      }
    }
  }, [autocomplete])

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const newPosition = { lat, lng }
      setMarkerPosition(newPosition)
      setMapCenter(newPosition)
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
    }
  }, [])

  // Convert 24-hour time to 12-hour format (e.g., "14:30" -> "2:30 PM")
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate required fields before submission
    const missingFields = []
    if (!formData.organizerName) missingFields.push('Your Name')
    if (!formData.instagramHandle) missingFields.push('Instagram Handle')
    if (!formData.email) missingFields.push('Email')
    if (!formData.eventName) missingFields.push('Event Name')
    if (!formData.eventType) missingFields.push('Event Type')
    if (isRecurring && !formData.eventDay) missingFields.push('Day')
    if (!isRecurring && !formData.eventDate) missingFields.push('Date')
    if (!formData.eventTime) missingFields.push('Time')
    if (!formData.location) missingFields.push('Location')

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`)
      setIsLoading(false)
      return
    }

    // Validate paid event requirements
    if (!formData.isFree) {
      const price = parseFloat(formData.price || '0')
      if (price <= 0) {
        setError('Please enter a valid price for your paid event')
        setIsLoading(false)
        return
      }
      if (!formData.paynowQrCode) {
        setError('Please upload a PayNow QR code so attendees can pay')
        setIsLoading(false)
        return
      }
    }

    try {
      // Format day display based on recurring vs one-time
      let dayDisplay = ''
      if (isRecurring) {
        dayDisplay = formData.eventDay
      } else {
        // Format date for display (e.g., "Jan 15, 2025")
        const date = new Date(formData.eventDate)
        dayDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      // Map form data to EventSubmission format for unified submission system
      const eventSubmissionData = {
        eventName: formData.eventName,
        category: formData.eventType,
        day: dayDisplay,
        eventDate: isRecurring ? undefined : formData.eventDate,
        time: formatTime12Hour(formData.eventTime),
        recurring: isRecurring,
        location: formData.location,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        placeId: formData.placeId || null,
        description: formData.description || '',
        communityLink: formData.communityLink || null,
        imageUrl: imageUrl || null,
        organizerName: formData.organizerName,
        organizerInstagram: formData.instagramHandle.replace('@', ''),
        contactEmail: formData.email,
        // Pricing fields
        isFree: formData.isFree,
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        // PayNow fields
        paynowEnabled: !formData.isFree && !!formData.paynowQrCode,
        paynowQrCode: formData.paynowQrCode || null,
        paynowNumber: formData.paynowNumber || null,
        // Link to user account
        clerkUserId: user?.id || null,
      }

      let response: Response
      try {
        response = await fetch('/api/submit-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventSubmissionData),
        })
      } catch {
        throw new Error('Network error. Please check your connection and try again.')
      }

      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`Server returned invalid response (status ${response.status})`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('[Host] Submit error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </Link>
              <h1 className="text-xl font-sans font-semibold text-neutral-900">List Your Event</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-sans text-display-section text-neutral-900 mb-4">
              You&apos;re all set.
            </h2>
            <p className="text-body-default text-neutral-600 mb-8">
              Your event is live. Share the link and start building your crew.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-neutral-900-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3 max-w-2xl mx-auto">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <h1 className="text-xl font-sans font-semibold text-neutral-900">List Your Event</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-neutral-900/10 text-neutral-900 px-4 py-2 rounded-full text-label font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Takes 5 minutes
            </div>
            <h2 className="font-sans text-display-lg md:text-display-xl text-neutral-900 mb-3">
              Share what moves you.
            </h2>
            <p className="text-body-lg text-neutral-600 max-w-md mx-auto">
              You bring the energy. We bring the people.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Users className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">Find your crew</span>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Calendar className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">Track RSVPs</span>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-neutral-100 shadow-card">
              <Sparkles className="w-6 h-6 text-neutral-900 mx-auto mb-2" />
              <span className="text-ui text-neutral-700">Always free</span>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Organizer Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide">About You</h3>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleChange}
                    required
                    placeholder="@yourhandle"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 my-6" />

            {/* Event Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide">Your Event</h3>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="Saturday Morning Run Club"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Type *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 appearance-none"
                >
                  <option value="">Select a type...</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Event Frequency Toggle */}
              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Schedule *
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setIsRecurring(true)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                      isRecurring
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Recurring
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(false)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                      !isRecurring
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Specific Date
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {isRecurring ? (
                    <>
                      <label className="block text-ui text-neutral-700 mb-1.5">
                        Day *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <select
                          name="eventDay"
                          value={formData.eventDay}
                          onChange={handleChange}
                          required={isRecurring}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 appearance-none"
                        >
                          <option value="">Select day...</option>
                          <option value="Every Monday">Every Monday</option>
                          <option value="Every Tuesday">Every Tuesday</option>
                          <option value="Every Wednesday">Every Wednesday</option>
                          <option value="Every Thursday">Every Thursday</option>
                          <option value="Every Friday">Every Friday</option>
                          <option value="Every Saturday">Every Saturday</option>
                          <option value="Every Sunday">Every Sunday</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekdays">Weekdays</option>
                          <option value="Weekends">Weekends</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-ui text-neutral-700 mb-1.5">
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="date"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleChange}
                          required={!isRecurring}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-ui text-neutral-700 mb-1.5">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                    <input
                      type="time"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 appearance-none min-h-[50px]"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Select event start time</p>
                </div>
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Location *
                </label>
                {mapsLoaded ? (
                  <div className="space-y-3">
                    <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged} options={AUTOCOMPLETE_OPTIONS}>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          required
                          placeholder="Search for a location..."
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
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

                    <p className="text-xs text-neutral-500">
                      Search for a venue or click on the map to set location
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="Marina Bay Sands, Singapore"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Description <span className="text-neutral-400">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about your event..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 resize-none"
                  />
                </div>
              </div>

              {/* Community Link */}
              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Community Group Link <span className="text-neutral-400">(optional)</span>
                </label>
                <input
                  type="url"
                  name="communityLink"
                  value={formData.communityLink}
                  onChange={handleChange}
                  placeholder="https://chat.whatsapp.com/... or https://t.me/..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  WhatsApp or Telegram group for attendees to join
                </p>
              </div>

              {/* Event Image Upload */}
              <div>
                <label className="block text-ui text-neutral-700 mb-1.5">
                  Event Image <span className="text-neutral-400">(optional)</span>
                </label>
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                    <Image src={imageUrl} alt="Event preview" width={400} height={200} className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900/80 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-50 border border-neutral-200 border-dashed p-6">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-neutral-400" />
                        <p className="text-sm text-neutral-500">Upload a photo for your event</p>
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
                            button: "bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-full text-sm transition-colors",
                            allowedContent: "hidden",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200 my-6" />

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-label text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </h3>

              {/* Free or Paid Toggle */}
              <div className="flex gap-4">
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer flex-1 transition-colors ${formData.isFree ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <input
                    type="radio"
                    name="pricingType"
                    checked={formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true }))}
                    className="w-5 h-5 text-neutral-900"
                  />
                  <div>
                    <span className="font-medium text-neutral-900">Community event</span>
                    <p className="text-sm text-neutral-500">Anyone can join</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer flex-1 transition-colors ${!formData.isFree ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <input
                    type="radio"
                    name="pricingType"
                    checked={!formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                    className="w-5 h-5 text-neutral-900"
                  />
                  <div>
                    <span className="font-medium text-neutral-900">Paid event</span>
                    <p className="text-sm text-neutral-500">Collect payments</p>
                  </div>
                </label>
              </div>

              {/* Paid Event Options */}
              {!formData.isFree && (
                <div className="space-y-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  {/* Price Input */}
                  <div>
                    <label className="block text-ui text-neutral-700 mb-1.5">
                      Price (SGD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                      <input
                        type="number"
                        name="price"
                        min="1"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="15.00"
                        required={!formData.isFree}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* PayNow QR Code Upload */}
                  <div>
                    <label className="block text-ui text-neutral-700 mb-1.5">
                      PayNow QR Code *
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      Upload your PayNow QR code so attendees can pay you directly
                    </p>
                    {formData.paynowQrCode ? (
                      <div className="relative rounded-xl overflow-hidden bg-white border border-neutral-200 w-48">
                        <Image
                          src={formData.paynowQrCode}
                          alt="PayNow QR"
                          width={192}
                          height={192}
                          className="w-48 h-48 object-contain bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paynowQrCode: '' }))}
                          className="absolute top-2 right-2 p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900/80 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white border border-neutral-200 border-dashed p-5 w-48">
                        {isUploadingQr ? (
                          <div className="flex flex-col items-center gap-2 text-neutral-500">
                            <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="w-8 h-8 text-neutral-400" />
                            <UploadButton
                              endpoint="eventImage"
                              onUploadBegin={() => setIsUploadingQr(true)}
                              onClientUploadComplete={(res) => {
                                setIsUploadingQr(false)
                                if (res?.[0]?.url) {
                                  setFormData(prev => ({ ...prev, paynowQrCode: res[0].url }))
                                }
                              }}
                              onUploadError={(error: Error) => {
                                setIsUploadingQr(false)
                                setError(`Upload failed: ${error.message}`)
                              }}
                              appearance={{
                                button: "bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-3 py-1.5 rounded-full text-xs transition-colors",
                                allowedContent: "hidden",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PayNow Number */}
                  <div>
                    <label className="block text-ui text-neutral-700 mb-1.5">
                      PayNow Phone or UEN <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="paynowNumber"
                      value={formData.paynowNumber}
                      onChange={handleChange}
                      placeholder="e.g., 91234567 or 202312345K"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/50 focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      For attendees who prefer to transfer manually
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-green-800">PayNow Payments</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">No fees</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Attendees scan your QR code and pay directly to your account. No platform fees!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isUploading || isUploadingQr}
              className="w-full bg-neutral-900 text-white py-4 rounded-full font-semibold text-lg hover:bg-neutral-900-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : isUploading || isUploadingQr ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading image...
                </>
              ) : (
                'List my event'
              )}
            </button>

            <p className="text-body-xs text-neutral-500 text-center">
              Free to list. No platform fees. Your event goes live instantly.
            </p>
          </form>

          {/* Link to Dashboard */}
          <div className="mt-8 text-center">
            <p className="text-body-small text-neutral-600">
              Already hosting?{' '}
              <Link href="/host/dashboard" className="text-neutral-900 font-medium hover:underline">
                Manage your events
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
