'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamicImport from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Instagram,
  Mail,
  User,
  FileText,
  Loader2,
  CheckCircle,
  DollarSign,
  ImageIcon,
  X,
  ChevronDown,
  Check,
  Plus,
  Globe,
  Ticket,
  Link2,
  Pencil,
  Users
} from 'lucide-react'
import { UploadButton, useUploadThing } from '@/lib/uploadthing'
import { ACTIVITY_CATEGORIES, CATEGORY_GROUPS, getCategoriesByGroup } from '@/lib/categories'
import { parseLocalDate } from '@/lib/event-dates'

// Dynamically import LocationAutocomplete to prevent SSR issues with Google Maps
const LocationAutocomplete = dynamicImport(
  () => import('./LocationAutocomplete').then(mod => ({ default: mod.LocationAutocomplete })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl">
        <MapPin className="w-5 h-5 text-neutral-500 shrink-0" />
        <span className="text-neutral-500">Loading location search...</span>
      </div>
    ),
  }
)

const eventTypes = ACTIVITY_CATEGORIES
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map(c => `${c.emoji} ${c.name}`)

export default function HostForm() {
  const router = useRouter()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Hook for programmatic uploads (drag & drop)
  const { startUpload } = useUploadThing('eventImage', {
    onClientUploadComplete: (res) => {
      setIsUploading(false)
      if (res?.[0]?.url) setImageUrl(res[0].url)
    },
    onUploadError: (err) => {
      setIsUploading(false)
      setError(`Upload failed: ${err.message}`)
    },
  })
  const [formInitialized, setFormInitialized] = useState(false)
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false)

  // Get user's timezone
  const userTimezone = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      // Get timezone abbreviation (e.g., "SGT", "PST", "EST")
      const abbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || ''
      // Get UTC offset (e.g., "GMT+8")
      const offset = new Date().toLocaleTimeString('en-US', { timeZoneName: 'shortOffset' }).split(' ').pop() || ''
      return { name: tz, abbr, offset }
    } catch {
      return { name: 'Asia/Singapore', abbr: 'SGT', offset: 'GMT+8' }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const [isRecurring, setIsRecurring] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [formData, setFormData] = useState({
    organizerName: '',
    instagramHandle: '',
    email: '',
    eventName: '',
    eventType: '',
    eventDay: '',
    eventDate: '',
    eventTime: '',
    endTime: '',
    location: '',
    latitude: 0,
    longitude: 0,
    placeId: '',
    description: '',
    communityLink: '',
    isFree: true,
    price: '',
    paynowQrCode: '',
    paynowNumber: '',
    maxSpots: '',
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

  // Drag and drop handlers
  const dragCounter = useRef(0)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))

    if (imageFile) {
      setIsUploading(true)
      await startUpload([imageFile])
    }
  }

  // Show loading while mounting or checking auth
  if (!mounted || !authLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Format time for display
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Format date for display
  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }))
    }
    // Clear general error message when user makes changes
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors({})

    // Validate required fields
    const errors: Record<string, boolean> = {}
    const missingFields: string[] = []

    if (!formData.eventName) { errors.eventName = true; missingFields.push('Event Name') }
    if (!formData.eventDate) { errors.eventDate = true; missingFields.push('Date') }
    if (!formData.eventTime) { errors.eventTime = true; missingFields.push('Time') }
    if (!formData.location) { errors.location = true; missingFields.push('Location') }

    // Check advanced settings fields
    if (!formData.organizerName) { errors.organizerName = true; missingFields.push('Your Name (in Advanced Settings)') }
    if (!formData.instagramHandle) { errors.instagramHandle = true; missingFields.push('Instagram (in Advanced Settings)') }
    if (!formData.email) { errors.email = true; missingFields.push('Email (in Advanced Settings)') }
    if (!formData.eventType) { errors.eventType = true; missingFields.push('Activity Type') }

    if (missingFields.length > 0) {
      setFieldErrors(errors)
      setError(`Please fill in: ${missingFields.join(', ')}`)
      setIsLoading(false)

      // Open advanced settings if any required fields there are missing
      if (errors.organizerName || errors.instagramHandle || errors.email) {
        setAdvancedSettingsOpen(true)
      }
      return
    }

    // Validate paid event requirements
    if (!formData.isFree) {
      const price = parseFloat(formData.price || '0')
      if (price <= 0) {
        setFieldErrors({ price: true })
        setError('Please enter a valid price for your paid event')
        setAdvancedSettingsOpen(true)
        setIsLoading(false)
        return
      }
      if (!formData.paynowQrCode) {
        setError('Please upload a PayNow QR code so attendees can pay')
        setAdvancedSettingsOpen(true)
        setIsLoading(false)
        return
      }
    }

    try {
      // Format day display
      let dayDisplay = ''
      if (isRecurring && formData.eventDay) {
        dayDisplay = formData.eventDay
      } else {
        const date = parseLocalDate(formData.eventDate)
        dayDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      const eventSubmissionData = {
        eventName: formData.eventName,
        category: formData.eventType,
        day: dayDisplay,
        eventDate: formData.eventDate,
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
        isFree: formData.isFree,
        price: formData.isFree ? null : Math.round(parseFloat(formData.price || '0') * 100),
        paynowEnabled: !formData.isFree && !!formData.paynowQrCode,
        paynowQrCode: formData.paynowQrCode || null,
        paynowNumber: formData.paynowNumber || null,
        clerkUserId: user?.id || null,
        maxSpots: formData.maxSpots ? parseInt(formData.maxSpots, 10) : null,
        scheduledPublishAt: scheduleEnabled && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : null,
      }

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventSubmissionData),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setIsSubmitted(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-300" />
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-32 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              You&apos;re all set!
            </h2>
            <p className="text-neutral-400 mb-8">
              {scheduleEnabled && scheduleDate && scheduleTime
                ? `Your event is scheduled to go live on ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
                : 'Your event is live. Share the link and start building your crew.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-semibold hover:bg-neutral-100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </Link>

            {/* Public Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-full">
              <Globe className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-300">Public</span>
            </div>

            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <main className="pt-20 pb-28 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Left Column - Form */}
              <div className="flex-1 space-y-6">
                {/* Event Name - Large Placeholder Style */}
                <div>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleChange}
                    placeholder="Enter experience name"
                    className={`w-full text-3xl md:text-4xl font-bold bg-transparent border-none text-white placeholder:text-neutral-600 focus:outline-none focus:ring-0 ${fieldErrors.eventName ? 'placeholder:text-red-400' : ''}`}
                  />
                  {fieldErrors.eventName && (
                    <p className="text-red-400 text-sm mt-1">Enter an experience name</p>
                  )}
                </div>

                {/* Date/Time Pills */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Start Date */}
                  <div className="relative">
                    <div className={`flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border rounded-full cursor-pointer hover:bg-neutral-800 transition-colors ${fieldErrors.eventDate ? 'border-red-500' : 'border-neutral-700'}`}>
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-transparent text-neutral-300 text-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="relative">
                    <div className={`flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border rounded-full cursor-pointer hover:bg-neutral-800 transition-colors ${fieldErrors.eventTime ? 'border-red-500' : 'border-neutral-700'}`}>
                      <input
                        type="time"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleChange}
                        className="bg-transparent text-neutral-300 text-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="relative">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-full cursor-pointer hover:bg-neutral-800 transition-colors">
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        placeholder="End"
                        className="bg-transparent text-neutral-300 text-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>

                  {/* Timezone Badge - shows user's local timezone */}
                  <div className="px-3 py-2.5 bg-neutral-800 rounded-full" title={userTimezone.name}>
                    <span className="text-sm text-neutral-400">{userTimezone.abbr || userTimezone.offset}</span>
                  </div>
                </div>

                {/* Repeat Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isRecurring
                        ? 'bg-white border-white'
                        : 'border-neutral-600 bg-transparent group-hover:border-neutral-500'
                    }`}
                  >
                    {isRecurring && <Check className="w-3 h-3 text-neutral-900" />}
                  </button>
                  <span className="text-neutral-400 text-sm">Set this event to repeat</span>
                </label>

                {/* Recurring Day Selection (shown when repeat is checked) */}
                <AnimatePresence>
                  {isRecurring && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <select
                        name="eventDay"
                        value={formData.eventDay}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-300 focus:outline-none focus:border-neutral-500 appearance-none"
                      >
                        <option value="">Select repeat frequency...</option>
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Schedule Publish Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setScheduleEnabled(!scheduleEnabled)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      scheduleEnabled
                        ? 'bg-white border-white'
                        : 'border-neutral-600 bg-transparent group-hover:border-neutral-500'
                    }`}
                  >
                    {scheduleEnabled && <Check className="w-3 h-3 text-neutral-900" />}
                  </button>
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-400 text-sm">Schedule for later</span>
                </label>

                {/* Schedule Date/Time Pickers */}
                <AnimatePresence>
                  {scheduleEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-full cursor-pointer hover:bg-neutral-800 transition-colors">
                              <Calendar className="w-4 h-4 text-neutral-400" />
                              <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                max={formData.eventDate || undefined}
                                className="bg-transparent text-neutral-300 text-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                              />
                            </div>
                          </div>
                          <div className="relative">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-full cursor-pointer hover:bg-neutral-800 transition-colors">
                              <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="bg-transparent text-neutral-300 text-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                              />
                            </div>
                          </div>
                          <div className="px-3 py-2.5 bg-neutral-800 rounded-full" title={userTimezone.name}>
                            <span className="text-sm text-neutral-400">{userTimezone.abbr || userTimezone.offset}</span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">Your event will go live at this time</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Location Input with Google Maps Autocomplete */}
                <LocationAutocomplete
                  value={formData.location}
                  hasError={fieldErrors.location}
                  onManualChange={(value) => {
                    setFormData(prev => ({ ...prev, location: value }))
                    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: false }))
                    if (error) setError('')
                  }}
                  onChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      location: data.location,
                      latitude: data.latitude,
                      longitude: data.longitude,
                      placeId: data.placeId,
                    }))
                    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: false }))
                    if (error) setError('')
                  }}
                />

                {/* Description Input */}
                <div className="flex items-start gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl focus-within:border-neutral-500 transition-colors">
                  <FileText className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add experience description"
                    rows={3}
                    className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Activity Type Selection — Two-step picker */}
                <div className="space-y-3">
                  <h3 className={`text-lg font-semibold ${fieldErrors.eventType ? 'text-red-400' : 'text-white'}`}>
                    What type of experience is this?
                  </h3>
                  {fieldErrors.eventType && (
                    <p className="text-red-400 text-sm">Please select an activity type</p>
                  )}

                  {/* Selected activity chip (shown when an activity is picked) */}
                  {formData.eventType && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-sm bg-white text-neutral-900 border border-white font-medium">
                        {formData.eventType}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, eventType: '' }))
                          setActiveGroup(null)
                        }}
                        className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  )}

                  {/* Step 1: Group pills */}
                  {!formData.eventType && (
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_GROUPS
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(group => {
                          const isActive = activeGroup === group.slug
                          // Check if the selected activity belongs to this group
                          const hasSelection = getCategoriesByGroup(group.slug).some(
                            cat => formData.eventType === `${cat.emoji} ${cat.name}`
                          )
                          return (
                            <button
                              key={group.slug}
                              type="button"
                              onClick={() => setActiveGroup(isActive ? null : group.slug)}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                isActive
                                  ? 'bg-white text-neutral-900 border-white font-medium'
                                  : hasSelection
                                    ? 'bg-neutral-800 text-white border-neutral-600 font-medium'
                                    : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600'
                              }`}
                            >
                              {group.emoji} {group.name}
                            </button>
                          )
                        })}
                    </div>
                  )}

                  {/* Step 2: Activities in selected group */}
                  <AnimatePresence>
                    {activeGroup && !formData.eventType && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pt-1">
                          {getCategoriesByGroup(activeGroup).map(cat => {
                            const value = `${cat.emoji} ${cat.name}`
                            return (
                              <button
                                key={cat.slug}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, eventType: value }))
                                  if (fieldErrors.eventType) {
                                    setFieldErrors(prev => ({ ...prev, eventType: false }))
                                  }
                                  if (error) setError('')
                                }}
                                className="px-3 py-1.5 rounded-full text-sm border bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-colors"
                              >
                                {cat.emoji} {cat.name}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tickets Section */}
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-neutral-500" />
                    <span className="text-neutral-300">Tickets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.isFree
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-neutral-800 text-white'
                    }`}>
                      {formData.isFree ? 'FREE' : `$${formData.price || '0'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdvancedSettingsOpen(true)}
                      className="p-1.5 hover:bg-neutral-800 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    <span className="font-medium">Advanced Settings</span>
                    <motion.div
                      animate={{ rotate: advancedSettingsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {advancedSettingsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4 bg-neutral-900 border border-neutral-700 rounded-xl">
                          {/* Organizer Section */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">About You</h4>

                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                              <input
                                type="text"
                                name="organizerName"
                                value={formData.organizerName}
                                onChange={handleChange}
                                placeholder="Your name *"
                                className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${fieldErrors.organizerName ? 'border-red-500' : 'border-neutral-700'}`}
                              />
                            </div>

                            <div className="relative">
                              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                              <input
                                type="text"
                                name="instagramHandle"
                                value={formData.instagramHandle}
                                onChange={handleChange}
                                placeholder="Instagram handle *"
                                className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${fieldErrors.instagramHandle ? 'border-red-500' : 'border-neutral-700'}`}
                              />
                            </div>

                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email *"
                                className={`w-full pl-10 pr-4 py-2.5 bg-neutral-800 border rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm ${fieldErrors.email ? 'border-red-500' : 'border-neutral-700'}`}
                              />
                            </div>
                          </div>

                          {/* Capacity */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Capacity</h4>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                              <input
                                type="number"
                                name="maxSpots"
                                min="1"
                                value={formData.maxSpots}
                                onChange={handleChange}
                                placeholder="Max attendees (leave empty for unlimited)"
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm"
                              />
                            </div>
                            <p className="text-xs text-neutral-500">Leave empty for unlimited spots</p>
                          </div>

                          {/* Pricing */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Pricing</h4>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isFree: true }))}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                                  formData.isFree
                                    ? 'bg-white text-neutral-900'
                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                }`}
                              >
                                Free
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isFree: false }))}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                                  !formData.isFree
                                    ? 'bg-white text-neutral-900'
                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                }`}
                              >
                                Paid
                              </button>
                            </div>

                            {!formData.isFree && (
                              <div className="space-y-3 pt-2">
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                  <input
                                    type="number"
                                    name="price"
                                    min="1"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Price (SGD)"
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm"
                                  />
                                </div>

                                {/* PayNow QR Upload */}
                                <div>
                                  <p className="text-xs text-neutral-500 mb-2">PayNow QR Code</p>
                                  {formData.paynowQrCode ? (
                                    <div className="relative w-32 h-32 bg-white rounded-lg overflow-hidden">
                                      <Image
                                        src={formData.paynowQrCode}
                                        alt="PayNow QR"
                                        fill
                                        className="object-contain"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, paynowQrCode: '' }))}
                                        className="absolute top-1 right-1 p-1 bg-neutral-900/80 rounded-full"
                                      >
                                        <X className="w-3 h-3 text-white" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-32">
                                      {isUploadingQr ? (
                                        <div className="h-32 flex items-center justify-center bg-neutral-800 rounded-lg">
                                          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                                        </div>
                                      ) : (
                                        <UploadButton
                                          endpoint="eventImage"
                                          onUploadBegin={() => setIsUploadingQr(true)}
                                          onClientUploadComplete={(res) => {
                                            setIsUploadingQr(false)
                                            if (res?.[0]?.url) {
                                              setFormData(prev => ({ ...prev, paynowQrCode: res[0].url }))
                                            }
                                          }}
                                          onUploadError={() => {
                                            setIsUploadingQr(false)
                                            setError('Failed to upload QR code')
                                          }}
                                          appearance={{
                                            button: "bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-3 py-2 rounded-lg",
                                            allowedContent: "hidden",
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  name="paynowNumber"
                                  value={formData.paynowNumber}
                                  onChange={handleChange}
                                  placeholder="PayNow number (optional)"
                                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 text-sm"
                                />
                              </div>
                            )}
                          </div>

                          {/* Community Link - hidden for now */}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column - Image Preview (Desktop) */}
              <div className="hidden lg:block w-[400px] shrink-0">
                <div className="sticky top-24">
                  {/* Main Image Preview with Drag & Drop */}
                  <div
                    className={`relative aspect-[1080/1350] bg-neutral-900 rounded-2xl overflow-hidden border-2 transition-colors ${
                      isDragging
                        ? 'border-white border-dashed bg-neutral-800'
                        : 'border-neutral-800'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {imageUrl ? (
                      <>
                        <Image
                          src={imageUrl}
                          alt="Event preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                            Recommended size: 1080 x 1350px
                          </span>
                          <button
                            type="button"
                            onClick={() => setImageUrl(null)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-900 text-white text-sm rounded-full transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Change image
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        {isUploading ? (
                          <>
                            <Loader2 className="w-10 h-10 animate-spin text-neutral-500" />
                            <p className="text-neutral-500 text-sm">Uploading...</p>
                          </>
                        ) : isDragging ? (
                          <>
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-white text-sm font-medium">Drop image here</p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-neutral-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-neutral-400 text-sm mb-1">Add cover image</p>
                              <p className="text-neutral-600 text-xs">Recommended: 1080 x 1350px</p>
                            </div>
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
                                button: "bg-white hover:bg-neutral-100 text-neutral-900 font-medium px-5 py-2.5 rounded-full text-sm transition-colors",
                                allowedContent: "hidden",
                              }}
                            />
                            <p className="text-neutral-600 text-xs">or drag and drop</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Additional Images Section */}
                  <div className="mt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-neutral-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-neutral-300 text-sm font-medium">Show what makes your event special with photos</p>
                        <div className="mt-2">
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
                              button: "flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm px-4 py-2 rounded-full transition-colors",
                              allowedContent: "hidden",
                            }}
                            content={{
                              button: () => (
                                <span className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  Add Images
                                </span>
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Image Upload */}
              <div className="lg:hidden">
                <div
                  className={`relative aspect-video bg-neutral-900 rounded-xl overflow-hidden border-2 transition-colors ${
                    isDragging
                      ? 'border-white border-dashed bg-neutral-800'
                      : 'border-neutral-800'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt="Event preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-2 right-2 p-2 bg-neutral-900/80 rounded-full"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
                      ) : isDragging ? (
                        <>
                          <ImageIcon className="w-8 h-8 text-white" />
                          <p className="text-white text-sm font-medium">Drop image here</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-neutral-600" />
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
                              button: "bg-white text-neutral-900 font-medium px-4 py-2 rounded-full text-sm",
                              allowedContent: "hidden",
                            }}
                          />
                          <p className="text-neutral-600 text-xs">or drag and drop</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky Bottom Publish Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom">
          <div className="bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 p-4">
            <div className="max-w-6xl mx-auto">
              <button
                type="submit"
                disabled={isLoading || isUploading || isUploadingQr}
                className="w-full bg-white text-neutral-900 py-4 rounded-full font-semibold text-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : isUploading || isUploadingQr ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : scheduleEnabled ? (
                  'Schedule'
                ) : (
                  'Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
