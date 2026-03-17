/**
 * Middleware — Auth & Route Protection
 *
 * AUTH ARCHITECTURE (two separate systems):
 *
 * System A — Clerk (primary):
 *   Used by all user-facing routes: /app, /buddy, /activities, /discover, /onboarding, etc.
 *   JWT is validated by Clerk middleware automatically.
 *   All new features (P2P) MUST use Clerk auth only.
 *
 * System B — OrganizerMagicLink (legacy):
 *   Used exclusively by /organizer/* routes and their API counterparts /api/organizer/*.
 *   Auth is cookie-based (getOrganizerSession() in /lib/organizer-session.ts).
 *   Organizer records have NO foreign key relation to User records.
 *   DO NOT use for new features.
 *
 * URL OWNERSHIP:
 *   /activities/[id]   → Activity model (System A, Clerk users) — canonical event URL
 *   /e/[id]            → EventSubmission model (System B, organizer events)
 *   /event/[slug]      → EventSubmission model (System B, organizer events, by slug)
 *   /events            → EventSubmission list (System B)
 *   /my-events         → Attendee management for both systems
 *   /buddy             → P2P sessions feed (System A, Clerk users)
 *   /organizer         → Organizer portal (System B, magic link auth)
 *   /host              → Host intake form → HostApplication model
 *
 * Note: /e/[id] and /event/[slug] are NOT short-links for /activities — they serve
 * completely different data (EventSubmission vs Activity). They are the organizer
 * portal's public event pages.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/browse(.*)',
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
  '/api/admin(.*)', // Has own multi-method auth (Clerk + admin secret + cookie)
  '/api/submit-event(.*)',
  '/api/my-events(.*)',
  '/api/organizer(.*)',
  '/api/stripe(.*)',
  '/api/checkout(.*)',
  '/api/wave(.*)',
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
  // /admin pages require Clerk auth at middleware level
  '/banned',
  '/explore',
  '/communities(.*)',
  '/buddy',
  '/api/map(.*)',
  '/api/test(.*)',
  '/api/cron(.*)',
  '/api/host-leads(.*)',
  '/api/discover/sessions(.*)',
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
