import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

// Geocode a location string to get coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !location) return null

  try {
    // Add Singapore context for better geocoding results
    const searchQuery = location.toLowerCase().includes('singapore')
      ? location
      : `${location}, Singapore`

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location
    }
    console.log(`Geocoding failed for "${location}":`, data.status)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export async function POST(request: Request) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all approved events missing coordinates
    const eventsMissingCoords = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { latitude: null },
          { longitude: null },
        ],
      },
      select: {
        id: true,
        eventName: true,
        location: true,
      },
    })

    console.log(`Found ${eventsMissingCoords.length} events missing coordinates`)

    const results: Array<{ id: string; eventName: string; location: string; success: boolean; coords?: { lat: number; lng: number } }> = []

    for (const event of eventsMissingCoords) {
      const coords = await geocodeLocation(event.location)

      if (coords) {
        await prisma.eventSubmission.update({
          where: { id: event.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        })
        results.push({ ...event, success: true, coords })
        console.log(`Geocoded "${event.eventName}" -> ${coords.lat}, ${coords.lng}`)
      } else {
        results.push({ ...event, success: false })
        console.log(`Failed to geocode "${event.eventName}" at "${event.location}"`)
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Geocoded ${successCount} of ${eventsMissingCoords.length} events`,
      results,
    })
  } catch (error) {
    console.error('Error geocoding events:', error)
    return NextResponse.json(
      { error: 'Failed to geocode events' },
      { status: 500 }
    )
  }
}

// GET to check status without making changes
export async function GET(request: Request) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const totalApproved = await prisma.eventSubmission.count({
      where: { status: 'APPROVED' },
    })

    const withCoords = await prisma.eventSubmission.count({
      where: {
        status: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
      },
    })

    const missingCoords = await prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { latitude: null },
          { longitude: null },
        ],
      },
      select: {
        id: true,
        eventName: true,
        location: true,
      },
    })

    return NextResponse.json({
      totalApproved,
      withCoords,
      missingCoords: missingCoords.length,
      eventsMissingCoords: missingCoords,
    })
  } catch (error) {
    console.error('Error checking geocode status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
