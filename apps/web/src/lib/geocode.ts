/**
 * Server-side geocoding utility.
 * Uses OpenStreetMap Nominatim (free, no API key) as primary,
 * Google Maps Geocoding API as fallback.
 */

interface GeoResult {
  lat: number
  lng: number
  displayName?: string
}

// Primary: OpenStreetMap Nominatim (free, no key, no referer restrictions)
async function nominatimGeocode(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SweatBuddies/1.0 (admin geocoding)' },
    })
    const data = await res.json()
    if (data?.[0]?.lat && data?.[0]?.lon) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      }
    }
    return null
  } catch {
    return null
  }
}

// Fallback: Google Maps Geocoding API (requires unrestricted server key)
async function googleGeocode(address: string): Promise<GeoResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const loc = data.results[0].geometry.location
      return { lat: loc.lat, lng: loc.lng, displayName: data.results[0].formatted_address }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Geocode an address to lat/lng coordinates.
 * Tries Nominatim first (free), falls back to Google Maps.
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  if (!address?.trim()) return null

  // Try Nominatim first
  const nominatim = await nominatimGeocode(address)
  if (nominatim) return nominatim

  // Fallback to Google
  const google = await googleGeocode(address)
  if (google) return google

  return null
}
