'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api'
import { toast } from 'sonner'
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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: {
    country: ['sg', 'th', 'id', 'my', 'ph', 'vn'],
  },
  types: ['(cities)'],
}

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
}

const LIBRARIES: ('places')[] = ['places']

const ACTIVITY_TYPES = [
  { value: 'RUN', label: 'Run' },
  { value: 'GYM', label: 'Gym' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'HIKE', label: 'Hike' },
  { value: 'CYCLING', label: 'Cycling' },
  { value: 'OTHER', label: 'Other' },
]

export default function EditActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })
  const [mapCenter, setMapCenter] = useState({ lat: 13.7563, lng: 100.5018 })
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing("activityImage")

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'RUN',
      city: '',
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

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/activities/${params.id}`)
        if (!response.ok) {
          throw new Error('Activity not found')
        }
        const data = await response.json()

        // Pre-populate form with existing data
        form.reset({
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'RUN',
          city: data.city || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '',
          endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '',
          maxPeople: data.maxPeople || undefined,
          imageUrl: data.imageUrl || '',
          price: data.price || 0,
          currency: data.currency || 'USD',
        })

        // Set map position
        if (data.latitude && data.longitude) {
          const position = { lat: data.latitude, lng: data.longitude }
          setMapCenter(position)
          setMarkerPosition(position)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching activity:', error)
        toast.error('Failed to load activity')
        router.push('/dashboard')
      }
    }

    fetchActivity()
  }, [params.id, form, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    toast.info('Uploading image...')

    try {
      const result = await startUpload([file])

      if (result && result[0]) {
        const imageUrl = `https://utfs.io/f/${result[0].key}`
        fieldOnChange(imageUrl)
        toast.success('Image uploaded successfully!')
      } else {
        throw new Error('No file uploaded')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
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

        form.setValue('latitude', lat, { shouldValidate: true })
        form.setValue('longitude', lng, { shouldValidate: true })
        form.setValue('city', place.name || '', { shouldValidate: true, shouldDirty: true })
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
      const response = await fetch(`/api/activities/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update activity')
      }

      const activity = await response.json()

      toast.success('Activity updated successfully!')
      router.push(`/activities/${activity.id}`)
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update activity')
      setIsSubmitting(false)
    }
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

  if (isLoading || !mapLoaded) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">Loading activity...</p>
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
          <h1 className="text-3xl font-bold mb-6">Edit Activity</h1>

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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What type of activity is this?
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Autocomplete
                        onLoad={setAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                        options={AUTOCOMPLETE_OPTIONS}
                      >
                        <Input
                          placeholder="Search for a city (SG, TH, ID, MY, PH, VN)"
                          {...field}
                        />
                      </Autocomplete>
                    </FormControl>
                    <FormDescription>
                      Search and select a city in Southeast Asia
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
                <Button type="submit" disabled={isSubmitting || !markerPosition}>
                  {isSubmitting ? 'Updating...' : 'Update Activity'}
                </Button>
              </div>
            </form>
          </Form>

          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Activity Update</DialogTitle>
                <DialogDescription>
                  Are you sure you want to update this activity?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <div>
                  <strong>Title:</strong> {form.getValues('title')}
                </div>
                <div>
                  <strong>Type:</strong> {form.getValues('type')}
                </div>
                <div>
                  <strong>City:</strong> {form.getValues('city')}
                </div>
                {form.getValues('description') && (
                  <div>
                    <strong>Description:</strong> {form.getValues('description')}
                  </div>
                )}
                <div>
                  <strong>Location:</strong> {form.getValues('latitude').toFixed(4)},{' '}
                  {form.getValues('longitude').toFixed(4)}
                </div>
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
                  {isSubmitting ? 'Updating...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}
