import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/uploadthing',
  '/api/activities(.*)',
  '/api/invites(.*)',  // Allow public access to invite links
  '/api/profiles(.*)', // Allow public access to profile endpoints
  '/api/beta(.*)',     // Beta API endpoints
  '/booking/success',
  '/join/(.*)',
  '/host/(.*)',  // Public host profile pages
  '/user/(.*)',  // Public user profile pages
  '/beta(.*)',   // Beta access pages
])

// Routes that bypass beta check entirely (system routes)
const isBetaExemptRoute = createRouteMatcher([
  '/beta(.*)',
  '/api/beta(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/images(.*)',
  '/fonts(.*)',
])

// Check if beta mode is enabled (can be toggled via env var for quick disable)
const BETA_MODE_ENABLED = process.env.NEXT_PUBLIC_BETA_MODE_ENABLED !== 'false'

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // Skip beta check for exempt routes
  if (isBetaExemptRoute(request)) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // If beta mode is disabled, skip beta gating
  if (!BETA_MODE_ENABLED) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // Check for beta access
  const betaAccessCookie = request.cookies.get('sb_beta_access')
  const { userId } = await auth()

  // If user is logged in, they have access (they got past the gate before)
  if (userId) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // If they have the beta access cookie, allow through
  if (betaAccessCookie?.value) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // No beta access - redirect to beta gate
  // Store the original URL to redirect back after access is granted
  const url = request.nextUrl.clone()
  url.pathname = '/beta'

  // Only add redirect param if it's not the home page
  if (pathname !== '/') {
    url.searchParams.set('redirect', pathname)
  }

  return NextResponse.redirect(url)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
