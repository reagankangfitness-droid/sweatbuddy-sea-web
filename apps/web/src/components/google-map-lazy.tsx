'use client'

import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api'
import { memo } from 'react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
}

interface GoogleMapLazyProps {
  latitude: number
  longitude: number
  title?: string
}

function GoogleMapLazyComponent({ latitude, longitude, title }: GoogleMapLazyProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  if (loadError) {
    return (
      <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Failed to load map</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={{ lat: latitude, lng: longitude }}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
      }}
    >
      <Marker position={{ lat: latitude, lng: longitude }} title={title} />
    </GoogleMap>
  )
}

// Memoize to prevent unnecessary re-renders
export const GoogleMapLazy = memo(GoogleMapLazyComponent)
