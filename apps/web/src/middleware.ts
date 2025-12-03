// TODO: Re-enable for marketplace phase (Year 2)
// - Clerk: user accounts, organizer dashboards
// - Beta access gating
//
// Original middleware commented out below for Phase 2 re-enablement

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Phase 1: All routes are public - no auth required
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}

/*
// =============================================================================
// ORIGINAL CLERK MIDDLEWARE - COMMENTED OUT FOR PHASE 1
// =============================================================================

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
  '/api/invites(.*)',
  '/api/profiles(.*)',
  '/api/beta(.*)',
  '/api/categories(.*)',
  '/api/reviews(.*)',
  '/booking/success',
  '/join/(.*)',
  '/host/(.*)',
  '/user/(.*)',
  '/activities/(.*)',
  '/beta(.*)',
])

// Routes that bypass beta check entirely
const isBetaExemptRoute = createRouteMatcher([
  '/',
  '/beta(.*)',
  '/api/beta(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/activities(.*)',
  '/_next(.*)',
  '/favicon.ico',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // Skip beta check for exempt routes
  if (isBetaExemptRoute(request)) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // Check for beta access cookie
  const betaAccessCookie = request.cookies.get('sb_beta_access')

  // If they have valid beta access, allow through
  if (betaAccessCookie?.value === 'verified') {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // No beta access - redirect to beta gate
  const url = request.nextUrl.clone()
  url.pathname = '/beta'

  if (pathname !== '/') {
    url.searchParams.set('redirect', pathname)
  }

  return NextResponse.redirect(url)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
*/
