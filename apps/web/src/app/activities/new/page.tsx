'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { useUploadThing } from '@/lib/uploadthing'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { activitySchema, type ActivityFormData } from '@/lib/validations/activity'
import { CategoryPicker } from '@/components/category-picker'
import { getCategoryBySlug, mapCategoryToLegacyType } from '@/lib/categories'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: {
    country: ['sg', 'th', 'id', 'my', 'ph', 'vn'],
  },
  types: ['establishment', 'geocode'],  // Search for places (gyms, museums, parks) and addresses
  fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
}

const DEFAULT_CENTER = {
  lat: 13.7563,
  lng: 100.5018,
}

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
}

const LIBRARIES: ('places')[] = ['places']

export default function NewActivityPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [organizerInstagram, setOrganizerInstagram] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing("activityImage")

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/activities/new')
    }
  }, [isLoaded, isSignedIn, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Starting upload for file:', file.name)
    setIsUploading(true)
    toast.info('Uploading image...')

    try {
      const result = await startUpload([file])
      console.log('Upload result:', JSON.stringify(result, null, 2))

      if (result && result[0]) {
        // Construct the URL from the uploaded file key
        const imageUrl = `https://utfs.io/f/${result[0].key}`
        console.log('Setting image URL:', imageUrl)
        console.log('Result object:', result[0])
        fieldOnChange(imageUrl)
        console.log('Field onChange called with:', imageUrl)
        toast.success('Image uploaded successfully!')
      } else {
        console.error('No result from upload:', result)
        throw new Error('No file uploaded')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'OTHER', // Will be auto-set based on categorySlug
      categorySlug: '',
      city: '',
      address: '',
      streetAddress: '',
      postalCode: '',
      country: '',
      placeId: '',
      latitude: 0,
      longitude: 0,
      startTime: '',
      endTime: '',
      maxPeople: undefined,
      imageUrl: '',
      price: 0,
      currency: 'USD',
    },
  })

  // Handle category selection - automatically updates legacy type field
  const handleCategoryChange = (slug: string | string[]) => {
    const categorySlug = Array.isArray(slug) ? slug[0] : slug
    form.setValue('categorySlug', categorySlug, { shouldValidate: true })

    // Auto-set the legacy type based on category for backwards compatibility
    const legacyType = mapCategoryToLegacyType(categorySlug)
    form.setValue('type', legacyType as 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER', { shouldValidate: true })
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const newPosition = { lat, lng }

        setMapCenter(newPosition)
        setMarkerPosition(newPosition)

        // Extract address components
        let streetAddress = ''
        let city = ''
        let postalCode = ''
        let country = ''

        place.address_components?.forEach((component) => {
          const types = component.types
          if (types.includes('street_number')) {
            streetAddress = component.long_name + ' '
          }
          if (types.includes('route')) {
            streetAddress += component.long_name
          }
          if (types.includes('locality') || types.includes('administrative_area_level_1')) {
            if (!city) city = component.long_name
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name
          }
          if (types.includes('country')) {
            country = component.long_name
          }
        })

        // For establishments, use place name + formatted address
        // For addresses, just use the formatted address
        const isEstablishment = place.types?.some(type =>
          ['establishment', 'point_of_interest', 'gym', 'park', 'museum', 'restaurant', 'cafe', 'stadium', 'health'].includes(type)
        )

        const displayAddress = isEstablishment && place.name
          ? `${place.name}, ${place.formatted_address || ''}`
          : place.formatted_address || ''

        // Set all form values
        form.setValue('latitude', lat, { shouldValidate: true })
        form.setValue('longitude', lng, { shouldValidate: true })
        form.setValue('address', displayAddress, { shouldValidate: true, shouldDirty: true })
        form.setValue('city', city || '', { shouldValidate: true, shouldDirty: true })
        form.setValue('streetAddress', streetAddress.trim() || place.name || '', { shouldValidate: true })
        form.setValue('postalCode', postalCode || '', { shouldValidate: true })
        form.setValue('country', country || '', { shouldValidate: true })
        form.setValue('placeId', place.place_id || '', { shouldValidate: true })
      }
    }
  }

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const newPosition = { lat, lng }

      setMarkerPosition(newPosition)
      form.setValue('latitude', lat)
      form.setValue('longitude', lng)
    }
  }

  const onSubmit = async (data: ActivityFormData) => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)

    try {
      const data = form.getValues()

      // Extract date and time from startTime (format: "2024-01-15T10:00")
      let eventDate: string | undefined
      let time = ''
      let day = ''

      if (data.startTime) {
        const startDate = new Date(data.startTime)
        eventDate = startDate.toISOString().split('T')[0] // YYYY-MM-DD

        // Format time as HH:MM AM/PM
        const hours = startDate.getHours()
        const minutes = startDate.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const formattedHours = hours % 12 || 12
        time = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`

        // Get day of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        day = days[startDate.getDay()]
      } else {
        // If no specific date, default to today
        day = new Date().toLocaleDateString('en-US', { weekday: 'long' })
        time = 'TBD'
      }

      // Get category name from slug
      const category = data.categorySlug ? getCategoryBySlug(data.categorySlug) : null
      const categoryName = category?.name || data.categorySlug || 'Other'

      // Map to EventSubmission format
      const eventSubmissionData = {
        eventName: data.title,
        category: categoryName,
        day,
        eventDate,
        time,
        recurring: false, // Dashboard submissions are for specific events
        location: data.address || data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        placeId: data.placeId,
        description: data.description,
        imageUrl: data.imageUrl,
        organizerName: user?.fullName || user?.firstName || 'Event Organizer',
        organizerInstagram: organizerInstagram || user?.username || '',
        contactEmail: user?.primaryEmailAddress?.emailAddress || '',
        // Pricing
        isFree: !data.price || data.price === 0,
        price: data.price ? Math.round(data.price * 100) : null, // Convert to cents
      }

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventSubmissionData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit event')
      }

      toast.success('Event submitted for review! You will be notified once it is approved (typically within 24 hours).')
      router.push('/host/dashboard')
    } catch (error) {
      console.error('Error submitting event:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit event')
      setIsSubmitting(false)
    }
  }

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </>
    )
  }

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Google Maps API Key Required
              </h2>
              <p className="text-sm text-muted-foreground">
                Please add your Google Maps API key to <code>.env.local</code> as{' '}
                <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create New Activity</h1>

          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Morning Run in Bangkok" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your activity a descriptive title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Category</FormLabel>
                      <FormControl>
                        <CategoryPicker
                          value={field.value || ''}
                          onChange={handleCategoryChange}
                          placeholder="Select activity category"
                          showGroups={true}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose the type of activity you are organizing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A refreshing morning run through the city parks..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add details about your activity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Image/Poster (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                              <img
                                src={field.value}
                                alt="Activity preview"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => field.onChange('')}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, field.onChange)}
                              disabled={isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? 'Uploading...' : 'Choose Image'}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload an image to make your activity stand out
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxPeople"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max People (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of participants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Activity cost per person
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="THB">THB - Thai Baht</SelectItem>
                            <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                            <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                            <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                            <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                            <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Currency for the price
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Organizer Info Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Organizer Information</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Your Name</label>
                        <Input
                          value={user?.fullName || user?.firstName || ''}
                          disabled
                          className="mt-1.5 bg-muted"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          From your account profile
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={user?.primaryEmailAddress?.emailAddress || ''}
                          disabled
                          className="mt-1.5 bg-muted"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Where attendees can reach you
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Instagram Handle *</label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          placeholder="yourusername"
                          value={organizerInstagram}
                          onChange={(e) => setOrganizerInstagram(e.target.value.replace(/^@/, ''))}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your Instagram handle for attendees to find and follow you
                      </p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Address</FormLabel>
                      <FormControl>
                        <Autocomplete
                          onLoad={setAutocomplete}
                          onPlaceChanged={onPlaceChanged}
                          options={AUTOCOMPLETE_OPTIONS}
                        >
                          <Input
                            placeholder="Search for a place or address (e.g., Red Dot Design Museum)"
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value)
                              // Also update city if user is manually typing
                              if (!form.getValues('city')) {
                                form.setValue('city', e.target.value)
                              }
                            }}
                          />
                        </Autocomplete>
                      </FormControl>
                      <FormDescription>
                        Search for gyms, parks, museums, or enter an address. You can edit after selecting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Location on Map
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Click on the map to set the exact location, or search for a city above
                  </p>
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapCenter}
                    zoom={12}
                    onClick={onMapClick}
                  >
                    {markerPosition && <Marker position={markerPosition} />}
                  </GoogleMap>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !markerPosition || !organizerInstagram}>
                    {isSubmitting ? 'Submitting...' : 'Submit Event'}
                  </Button>
                </div>
                {!organizerInstagram && (
                  <p className="text-sm text-amber-600">
                    Please enter your Instagram handle above to submit.
                  </p>
                )}
              </form>
            </Form>
          </LoadScript>

          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Event for Review</DialogTitle>
                <DialogDescription>
                  Your event will be reviewed by our team before going live. This typically takes up to 24 hours.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <div>
                  <strong>Title:</strong> {form.getValues('title')}
                </div>
                <div>
                  <strong>Category:</strong>{' '}
                  {(() => {
                    const categorySlug = form.getValues('categorySlug')
                    if (categorySlug) {
                      const category = getCategoryBySlug(categorySlug)
                      return category ? `${category.emoji} ${category.name}` : categorySlug
                    }
                    return form.getValues('type')
                  })()}
                </div>
                <div>
                  <strong>Location:</strong> {form.getValues('address') || form.getValues('city')}
                </div>
                {form.getValues('startTime') && (
                  <div>
                    <strong>Date/Time:</strong> {new Date(form.getValues('startTime')).toLocaleString()}
                  </div>
                )}
                {form.getValues('description') && (
                  <div>
                    <strong>Description:</strong> {form.getValues('description')}
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <strong>Organizer:</strong> {user?.fullName || user?.firstName} (@{organizerInstagram})
                </div>
                <div>
                  <strong>Contact:</strong> {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              {/* Approval Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> All events are reviewed before being published to ensure quality and safety for our community. You will receive a notification once your event is approved.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}
