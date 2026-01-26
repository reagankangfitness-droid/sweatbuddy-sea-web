import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import neighborhoodsData from '@/data/neighborhoods.json'

export const dynamic = 'force-dynamic'

// Check if a point is within a neighborhood's bounds
function isPointInNeighborhood(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
}

// Find the best matching neighborhood for coordinates
function findNeighborhoodForCoordinates(lat: number, lng: number): string | null {
  for (const neighborhood of neighborhoodsData.neighborhoods) {
    if (isPointInNeighborhood(lat, lng, neighborhood.bounds)) {
      return neighborhood.id
    }
  }

  // If no exact match, find nearest neighborhood by center distance
  let nearestId: string | null = null
  let minDistance = Infinity

  for (const neighborhood of neighborhoodsData.neighborhoods) {
    const distance = Math.sqrt(
      Math.pow(lat - neighborhood.coordinates.lat, 2) +
        Math.pow(lng - neighborhood.coordinates.lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestId = neighborhood.id
    }
  }

  // Only assign if within reasonable distance (roughly 5km)
  if (minDistance < 0.05) {
    return nearestId
  }

  return null
}

export async function POST() {
  try {
    // Get all activities with coordinates but no neighborhoodId
    const activities = await prisma.activity.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        neighborhoodId: true,
      },
    })

    const updates: { id: string; neighborhoodId: string; title: string }[] = []

    for (const activity of activities) {
      if (activity.latitude && activity.longitude) {
        const neighborhoodId = findNeighborhoodForCoordinates(
          activity.latitude,
          activity.longitude
        )

        if (neighborhoodId && neighborhoodId !== activity.neighborhoodId) {
          updates.push({
            id: activity.id,
            neighborhoodId,
            title: activity.title,
          })
        }
      }
    }

    // Update activities in batch
    let updatedCount = 0
    for (const update of updates) {
      await prisma.activity.update({
        where: { id: update.id },
        data: { neighborhoodId: update.neighborhoodId },
      })
      updatedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} activities with neighborhood IDs`,
      updates: updates.map((u) => ({ id: u.id, title: u.title, neighborhoodId: u.neighborhoodId })),
    })
  } catch (error) {
    console.error('Error assigning neighborhoods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign neighborhoods' },
      { status: 500 }
    )
  }
}

// GET to preview what would be updated
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        neighborhoodId: true,
        address: true,
      },
    })

    const preview = activities.map((activity) => {
      const suggestedNeighborhood =
        activity.latitude && activity.longitude
          ? findNeighborhoodForCoordinates(activity.latitude, activity.longitude)
          : null

      return {
        id: activity.id,
        title: activity.title,
        address: activity.address,
        currentNeighborhood: activity.neighborhoodId,
        suggestedNeighborhood,
        wouldUpdate: suggestedNeighborhood && suggestedNeighborhood !== activity.neighborhoodId,
      }
    })

    return NextResponse.json({
      success: true,
      totalActivities: activities.length,
      wouldUpdate: preview.filter((p) => p.wouldUpdate).length,
      preview,
    })
  } catch (error) {
    console.error('Error previewing neighborhoods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to preview neighborhoods' },
      { status: 500 }
    )
  }
}
