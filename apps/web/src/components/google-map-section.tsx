'use client'

import Link from 'next/link'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'

interface Participant {
  id: string
  name: string | null
  imageUrl: string | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl?: string | null
  price?: number
  currency?: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  userActivities?: Array<{
    user: Participant
  }>
}

interface GoogleMapSectionProps {
  activities: Activity[]
  selectedActivity: Activity | null
  mapCenter: { lat: number; lng: number }
  onMarkerClick: (activity: Activity) => void
  onInfoWindowClose: () => void
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
}

const LIBRARIES: ('places')[] = ['places']

export default function GoogleMapSection({
  activities,
  selectedActivity,
  mapCenter,
  onMarkerClick,
  onInfoWindowClose,
}: GoogleMapSectionProps) {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          Google Maps API key required for map view
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={mapCenter}
          zoom={activities.length === 1 ? 12 : 6}
        >
          {activities.map((activity) => (
            <Marker
              key={activity.id}
              position={{ lat: activity.latitude, lng: activity.longitude }}
              onClick={() => onMarkerClick(activity)}
            />
          ))}

          {selectedActivity && (
            <InfoWindow
              position={{
                lat: selectedActivity.latitude,
                lng: selectedActivity.longitude,
              }}
              onCloseClick={onInfoWindowClose}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold mb-1" style={{ fontSize: '15px' }}>
                  {selectedActivity.title}
                </h3>
                <p className="text-gray-600 mb-2" style={{ fontSize: '12px' }}>
                  {selectedActivity.type} • {selectedActivity.city}
                </p>
                {selectedActivity.price !== undefined && selectedActivity.price > 0 && (
                  <p className="font-semibold mb-2" style={{ fontSize: '13px', color: '#CC9900' }}>
                    {selectedActivity.currency || 'USD'} {selectedActivity.price.toFixed(2)}
                  </p>
                )}
                {selectedActivity.description && (
                  <p className="text-gray-700 mb-3 line-clamp-2" style={{ fontSize: '12px' }}>
                    {selectedActivity.description}
                  </p>
                )}
                <Link href={`/activities/${selectedActivity.id}`}>
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  )
}
