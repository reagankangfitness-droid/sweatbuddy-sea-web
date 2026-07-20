import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GOOGLE_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_MAPS_SERVER_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_API_REFERER = process.env.GOOGLE_API_REFERER || 'https://www.sweatbuddies.co/'
const FALLBACK_IMAGE = '/images/cities/singapore.jpg'

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId')
  const photoIndex = clampNumber(Number(request.nextUrl.searchParams.get('photoIndex') || 0), 0, 20)
  const maxWidth = clampNumber(Number(request.nextUrl.searchParams.get('maxWidth') || 900), 64, 1600)

  if (!GOOGLE_API_KEY || !placeId) return redirectToFallback(request)

  try {
    const details = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'photos',
        Referer: GOOGLE_API_REFERER,
      },
      cache: 'no-store',
    })

    if (!details.ok) return redirectToFallback(request)

    const payload = await details.json()
    const photoName = payload.photos?.[photoIndex]?.name
    if (!photoName) return redirectToFallback(request)

    const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`)
    mediaUrl.searchParams.set('maxWidthPx', String(maxWidth))
    mediaUrl.searchParams.set('skipHttpRedirect', 'true')
    mediaUrl.searchParams.set('key', GOOGLE_API_KEY)

    const mediaResponse = await fetch(mediaUrl, {
      headers: { Referer: GOOGLE_API_REFERER },
      cache: 'no-store',
    })
    if (!mediaResponse.ok) return redirectToFallback(request)

    const media = await mediaResponse.json()
    if (!media.photoUri) return redirectToFallback(request)

    return NextResponse.redirect(media.photoUri, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    })
  } catch {
    return redirectToFallback(request)
  }
}

function redirectToFallback(request: NextRequest) {
  return NextResponse.redirect(new URL(FALLBACK_IMAGE, request.nextUrl.origin), {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  })
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}
