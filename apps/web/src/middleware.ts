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
  '/api/categories(.*)', // Allow public access to categories
  '/api/reviews(.*)',  // Allow public access to reviews
  '/booking/success',
  '/join/(.*)',
  '/host/(.*)',  // Public host profile pages
  '/user/(.*)',  // Public user profile pages
  '/activities/(.*)',  // Public activity pages
])

export default clerkMiddleware(async (auth, request) => {
  // Simple auth check - no beta gating
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
