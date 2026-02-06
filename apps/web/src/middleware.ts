import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/e/(.*)',
  '/events',
  '/events/(.*)',
  '/api/webhooks(.*)',
  '/api/uploadthing',
  '/api/activities(.*)',
  '/api/events(.*)',
  '/api/invites(.*)',
  '/api/profiles(.*)',
  '/api/og(.*)',
  '/api/categories(.*)',
  '/api/reviews(.*)',
  '/api/attendance(.*)',
  '/api/event-waitlist(.*)',
  '/api/newsletter(.*)',
  '/api/signup(.*)',
  '/api/admin(.*)',
  '/api/submit-event(.*)',
  '/api/my-events(.*)',
  '/api/organizer(.*)',
  '/api/stripe(.*)',
  '/api/checkout(.*)',
  '/booking/success',
  '/join/(.*)',
  '/host',
  '/host/(.*)',
  '/user/(.*)',
  '/activities/(.*)',
  '/organizer',
  '/organizer/(.*)',
  '/my-events',
  '/my-events/(.*)',
  '/admin(.*)',
  '/explore',
  '/api/map(.*)',
  '/crews',
  '/api/test(.*)',
  '/api/cron(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // If it's not a public route, require authentication
  if (!isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', request.url).toString(),
    })
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
