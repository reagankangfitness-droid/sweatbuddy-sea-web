/**
 * Proxy — Auth & Route Protection
 *
 * AUTH ARCHITECTURE (two separate systems):
 *
 * System A — Clerk (primary):
 *   Used by all user-facing routes: /app, /buddy, /activities, /discover, /onboarding, etc.
 *   JWT is validated by Clerk proxy automatically.
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
 *   /events            → legacy list redirected to /buddy
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
import type { NextRequest } from 'next/server'

const MOBILE_USER_AGENT_PATTERN = /\b(Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini)\b/i
const BOT_USER_AGENT_PATTERN = /\b(bot|crawler|spider|preview|facebookexternalhit|slackbot|twitterbot|linkedinbot|whatsapp)\b/i

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/browse(.*)',
  '/cities(.*)',
  '/community',
  '/saved',
  '/coach/templates(.*)',
  '/singapore',
  '/bangkok',
  '/new-to-singapore',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/e/(.*)',
  '/events',
  '/events/(.*)',
  '/api/webhooks(.*)',
  '/api/uploadthing',
  '/api/activities(.*)',
  '/api/analytics',
  '/api/events(.*)',
  '/api/invites(.*)',
  '/api/profiles(.*)',
  '/api/og(.*)',
  '/api/categories(.*)',
  '/api/reviews(.*)',
  '/api/attendance(.*)',
  '/api/event-waitlist(.*)',
  '/api/newsletter(.*)',
  '/api/landing-leads(.*)',
  '/api/community-nominations(.*)',
  '/api/communities(.*)',
  '/api/signup(.*)',
  '/api/admin(.*)', // Has own multi-method auth (Clerk + admin secret)
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
  '/banned',
  '/explore',
  '/communities(.*)',
  '/buddy',
  '/hub',
  '/hub/(.*)',
  '/api/buddy(.*)',
  '/api/host(.*)',
  '/api/user(.*)',
  '/api/map(.*)',
  '/api/test(.*)',
  '/api/cron(.*)',
  '/api/host-leads(.*)',
  '/api/search(.*)',
  '/my-sessions',
  '/notifications',
  '/admin(.*)', // Admin shell handles Clerk/admin checks and admin APIs remain protected.
])

export default clerkMiddleware(async (auth, request) => {
  const legacyRedirect = getLegacyRouteRedirect(request)
  if (legacyRedirect) return legacyRedirect

  if (shouldSendRootToMobileMap(request)) {
    const target = new URL('/buddy', request.url)

    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (key !== 'landing') target.searchParams.set(key, value)
    }

    target.searchParams.set('view', 'map')
    return NextResponse.redirect(target)
  }

  const isAdminShellRoute = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')

  // If it's not a public route, require authentication
  if (!isPublicRoute(request) && !isAdminShellRoute) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set(
      'redirect_url',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )

    await auth.protect({
      unauthenticatedUrl: signInUrl.toString(),
    })
  }
  return NextResponse.next()
})

function getLegacyRouteRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === '/browse' || pathname.startsWith('/browse/')) {
    const target = new URL('/buddy', request.url)
    const activity = searchParams.get('type') ?? searchParams.get('cat')
    target.searchParams.set('view', 'map')
    if (activity) target.searchParams.set('type', activity)
    return NextResponse.redirect(target)
  }

  if (pathname === '/events' || pathname.startsWith('/events/')) {
    const target = new URL('/buddy', request.url)
    const activity = searchParams.get('cat') ?? searchParams.get('type')
    const city = searchParams.get('city')
    target.searchParams.set('view', 'map')
    if (activity) target.searchParams.set('type', activity)
    if (city) target.searchParams.set('city', city)
    return NextResponse.redirect(target)
  }

  if (pathname === '/community') {
    return NextResponse.redirect(new URL('/communities', request.url))
  }

  if (pathname === '/saved') {
    return NextResponse.redirect(new URL('/my-sessions', request.url))
  }

  if (pathname === '/cities') {
    return NextResponse.redirect(new URL('/buddy?view=map', request.url))
  }

  if (pathname.startsWith('/cities/')) {
    const slug = pathname.replace('/cities/', '').split('/')[0]
    if (slug === 'singapore') return NextResponse.redirect(new URL('/singapore', request.url))
    if (slug === 'bangkok') return NextResponse.redirect(new URL('/bangkok', request.url))
    return NextResponse.redirect(new URL(`/buddy?view=map&city=${encodeURIComponent(slug)}`, request.url))
  }

  if (pathname === '/coach/templates' || pathname.startsWith('/coach/templates/')) {
    return NextResponse.redirect(new URL('/host/templates', request.url))
  }

  if (pathname === '/onboarding/coach') {
    return NextResponse.redirect(new URL('/host', request.url))
  }

  if (pathname === '/onboarding/p2p') {
    return NextResponse.redirect(new URL('/buddy', request.url))
  }

  return null
}

function shouldSendRootToMobileMap(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') return false
  if (request.nextUrl.searchParams.get('landing') === '1') return false

  const userAgent = request.headers.get('user-agent') ?? ''
  if (!MOBILE_USER_AGENT_PATTERN.test(userAgent)) return false
  if (BOT_USER_AGENT_PATTERN.test(userAgent)) return false

  return true
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
