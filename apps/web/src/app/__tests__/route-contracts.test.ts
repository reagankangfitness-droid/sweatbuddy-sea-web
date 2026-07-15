import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '../..')

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readRepoJson<T>(relativePath: string): T {
  return JSON.parse(readRepoFile(relativePath)) as T
}

function expectRoute(relativePath: string) {
  expect(existsSync(path.join(repoRoot, relativePath))).toBe(true)
}

describe('route contracts', () => {
  it('keeps the public homepage centered on marketplace discovery in Singapore and Bangkok', () => {
    const homePage = readRepoFile('apps/web/src/app/page.tsx')
    const rootLayout = readRepoFile('apps/web/src/app/layout.tsx')
    const browsePage = readRepoFile('apps/web/src/app/browse/page.tsx')
    const communitiesPage = readRepoFile('apps/web/src/app/communities/page.tsx')
    const eventsRoute = readRepoFile('apps/web/src/app/events/page.tsx')
    const buddyPage = readRepoFile('apps/web/src/app/buddy/page.tsx')
    const createChoiceSheet = readRepoFile('apps/web/src/components/CreateChoiceSheet.tsx')
    const appNav = readRepoFile('apps/web/src/components/AppNav.tsx')
    const hostPage = readRepoFile('apps/web/src/app/host/page.tsx')
    const newcomerPage = readRepoFile('apps/web/src/app/new-to-singapore/page.tsx')
    const singaporePage = readRepoFile('apps/web/src/app/singapore/page.tsx')
    const bangkokPage = readRepoFile('apps/web/src/app/bangkok/page.tsx')
    const cityLanding = readRepoFile('apps/web/src/lib/city-landing.ts')
    const cityLandingComponent = readRepoFile('apps/web/src/components/landing/CityLandingPage.tsx')
    const proxy = readRepoFile('apps/web/src/proxy.ts')

    expect(homePage).toContain('Find a fitness plan with people already going.')
    expect(homePage).toContain(
      'Discover run clubs, yoga, pickleball, strength, recovery, and wellness events.',
    )
    expect(homePage).toContain('the host, the plan, and the people signals before you show up.')
    expect(homePage).toContain('Social plans people are joining')
    expect(homePage).toContain('Start with a plan people can join')
    expect(homePage).toContain('Map preview')
    expect(homePage).toContain('Open map')
    expect(homePage).toContain('Browse by activity')
    expect(homePage).toContain('Host an event')
    expect(homePage).toContain('Submit a source')
    expect(homePage).toContain('/communities/create')
    expect(homePage).toContain('/buddy?create=session')
    expect(homePage).toContain('/buddy?city=singapore')
    expect(homePage).toContain('/buddy?city=bangkok')
    expect(homePage).toContain('/buddy?type=running')
    expect(homePage).toContain('/buddy?pricing=free')
    expect(homePage).not.toContain('The OS for Fitness Community Leaders')
    expect(homePage).not.toContain('Your next crew is')

    expect(rootLayout).toContain('SweatBuddies | Social Fitness Events in Bangkok and Singapore')
    expect(rootLayout).toContain('Find your people through fitness.')
    expect(rootLayout).not.toContain('Discover Fitness & Wellness Experiences')
    expect(rootLayout).not.toContain('fitness and wellness experiences')

    expect(eventsRoute).toContain('redirect(`/buddy?')
    expect(browsePage).toContain('redirect(`/buddy?')

    expect(buddyPage).toContain('Search run clubs, yoga, pickleball, or neighborhoods')
    expect(buddyPage).toContain("searchParams.get('type') ?? searchParams.get('cat')")
    expect(buddyPage).toContain('getCityLocationConfig(requestedCitySlug)')
    expect(buddyPage).toContain('Find a fitness plan with people already going')
    expect(buddyPage).toContain('people going')
    expect(buddyPage).toContain('Event-first discovery')
    expect(buddyPage).toContain('/api/buddy/sessions/${session.id}/join')
    expect(buddyPage).toContain('buddy_quick_rsvp_joined')
    expect(buddyPage).toContain('FollowAfterRsvpPrompt')
    expect(buddyPage).toContain('GoingSoloAfterRsvpPrompt')
    expect(buddyPage).toContain('AttendeePreviewSheet')
    expect(buddyPage).toContain('onPreviewAttendees')
    expect(buddyPage).toContain('Going to this')
    expect(buddyPage).toContain('/api/events/${session.id}/going-solo')
    expect(buddyPage).toContain('buddy_going_solo_answered')
    expect(buddyPage).toContain('sortSessionsBySocialMomentum')
    expect(buddyPage).toContain('First-timers welcome')
    expect(buddyPage).toContain("searchParams.get('create')")
    expect(createChoiceSheet).toContain('What do you want to add?')
    expect(createChoiceSheet).toContain('Host an event')
    expect(createChoiceSheet).toContain('Submit a source')
    expect(appNav).toContain('CreateChoiceSheet')
    expect(buddyPage).toContain('No events listed here yet.')
    expect(buddyPage).toContain('No events or hosts for')

    expect(communitiesPage).toContain('Find local fitness communities near you')
    expect(hostPage).toContain('List events people can find, trust, and come back to.')
    expect(hostPage).toContain('Run the event. Let the page carry the proof.')
    expect(hostPage).toContain('verify the source behind the event')
    expect(hostPage).toContain('Host your first session')
    expect(hostPage).toContain('/buddy?create=session')
    expect(hostPage).toContain('Need help launching a crew?')
    expect(hostPage).toContain('What do people show up for?')
    expect(hostPage).toContain('people nearby are actively looking')
    expect(hostPage).not.toContain('Apply to host')
    expect(hostPage).not.toContain("I'm interested")
    expect(hostPage).not.toContain('What do you love to teach?')

    expect(newcomerPage).toContain("from '@/app/singapore/page'")
    expect(singaporePage).toContain('Find Friends Through Fitness in Singapore')
    expect(bangkokPage).toContain('Find Friends Through Fitness in Bangkok')
    expect(cityLanding).toContain('Find friends through fitness in Singapore.')
    expect(cityLanding).toContain('Find friends through fitness in Bangkok.')
    expect(cityLanding).toContain(
      'where movement gives everyone a reason to show up, talk, and come back',
    )
    expect(cityLanding).toContain('Grow beyond Instagram, LINE, and word of mouth.')
    expect(cityLandingComponent).toContain("experiment: 'two_city_newcomer_wedge'")
    expect(proxy).toContain('/singapore')
    expect(proxy).toContain('/bangkok')
    expect(proxy).toContain('/new-to-singapore')
  })

  it('redirects legacy discovery pages into the current map and community surfaces', () => {
    const browsePage = readRepoFile('apps/web/src/app/browse/page.tsx')
    const eventsPage = readRepoFile('apps/web/src/app/events/page.tsx')
    const communityPage = readRepoFile('apps/web/src/app/community/page.tsx')
    const savedPage = readRepoFile('apps/web/src/app/saved/page.tsx')
    const citiesPage = readRepoFile('apps/web/src/app/cities/page.tsx')
    const cityPage = readRepoFile('apps/web/src/app/cities/[slug]/page.tsx')
    const nextConfig = readRepoFile('apps/web/next.config.js')
    const sitemap = readRepoFile('apps/web/src/app/sitemap.ts')
    const proxy = readRepoFile('apps/web/src/proxy.ts')

    expect(browsePage).toContain('redirect(`/buddy?')
    expect(eventsPage).toContain('redirect(`/buddy?')
    expect(communityPage).toContain("redirect('/communities')")
    expect(savedPage).toContain("redirect('/my-sessions')")
    expect(citiesPage).toContain("redirect('/buddy?view=map')")
    expect(cityPage).toContain("redirect('/singapore')")
    expect(cityPage).toContain("redirect('/bangkok')")
    expect(cityPage).toContain('redirect(`/buddy?view=map&city=')
    expect(nextConfig).toContain("source: '/community'")
    expect(nextConfig).toContain("source: '/saved'")
    expect(nextConfig).toContain("source: '/cities/:slug'")
    expect(nextConfig).toContain("source: '/events'")
    expect(proxy).toContain('function getLegacyRouteRedirect')
    expect(proxy.indexOf('getLegacyRouteRedirect(request)')).toBeLessThan(
      proxy.indexOf('auth.protect'),
    )
    expect(proxy).toContain('/sitemap.xml')
    expect(proxy).toContain('/robots.txt')
    expect(proxy).toContain("pathname === '/community'")
    expect(proxy).toContain("pathname.startsWith('/cities/')")
    expect(sitemap).not.toContain('/browse')
    expect(sitemap).not.toContain('/cities')
    expect(sitemap).not.toContain('/events')
    expect(sitemap).not.toContain('/community')
    expect(sitemap).not.toContain('/discover')
    expect(sitemap).not.toContain('/explore')
  })

  it('keeps host routes reachable without redirecting the full host tree', () => {
    const nextConfig = readRepoFile('apps/web/next.config.js')

    expect(nextConfig).not.toContain("source: '/host'")
    expect(nextConfig).not.toContain("source: '/host/:path*'")
    expectRoute('apps/web/src/app/host/community/page.tsx')
    expectRoute('apps/web/src/app/host/templates/page.tsx')
    expectRoute('apps/web/src/app/host/payments/page.tsx')
    expectRoute('apps/web/src/app/host/plan/page.tsx')
  })

  it('keeps logged-in host surfaces aligned around community growth', () => {
    const dashboardPage = readRepoFile('apps/web/src/app/host/dashboard/page.tsx')
    const hubPage = readRepoFile('apps/web/src/app/hub/page.tsx')
    const hubClient = readRepoFile('apps/web/src/app/hub/HubClient.tsx')
    const communityPage = readRepoFile('apps/web/src/app/host/community/page.tsx')
    const analyticsPage = readRepoFile('apps/web/src/app/host/analytics/page.tsx')
    const contentPage = readRepoFile('apps/web/src/app/host/content/page.tsx')
    const earningsPage = readRepoFile('apps/web/src/app/host/earnings/page.tsx')
    const growthPage = readRepoFile('apps/web/src/app/host/growth/page.tsx')
    const wavesPage = readRepoFile('apps/web/src/app/host/waves/page.tsx')
    const planPage = readRepoFile('apps/web/src/app/host/plan/page.tsx')
    const nextConfig = readRepoFile('apps/web/next.config.js')
    const planner = readRepoFile('apps/web/src/components/host/AIPlannerChat.tsx')

    expect(dashboardPage).toContain("redirect('/hub')")
    expect(hubPage).toContain("redirect('/sign-in?redirect_url=/hub')")
    expect(hubClient).toContain('Next session')
    expect(hubClient).toContain('Mark Attendance')
    expect(hubClient).toContain('Your crew')
    expect(hubClient).toContain('/host/community')
    expect(hubClient).toContain('/host/templates')
    expect(hubClient).toContain('/host/payments')
    expect(hubClient).not.toContain('/host/analytics')
    expect(hubClient).not.toContain('/host/content')
    expect(communityPage).toContain('Regulars & Community Health')
    expect(communityPage).toContain('Invite Regulars')
    expect(analyticsPage).toContain("redirect('/hub')")
    expect(contentPage).toContain("redirect('/hub')")
    expect(earningsPage).toContain("redirect('/hub')")
    expect(growthPage).toContain("redirect('/hub')")
    expect(wavesPage).toContain("redirect('/buddy/host/new')")
    expect(nextConfig).toContain("source: '/host/dashboard'")
    expect(nextConfig).toContain("source: '/host/analytics'")
    expect(nextConfig).toContain("source: '/host/content'")
    expect(nextConfig).toContain("source: '/host/growth'")
    expect(nextConfig).toContain("source: '/host/earnings'")
    expect(nextConfig).toContain("source: '/host/waves'")
    expect(planPage).toContain('Plan Your Next Session')
    expect(planPage).toContain('Back to Hub')
    expect(planner).toContain('Community Session Planner')
  })

  it('redirects legacy coach onboarding and template pages into host surfaces', () => {
    const coachTemplates = readRepoFile('apps/web/src/app/coach/templates/page.tsx')
    const newCoachTemplate = readRepoFile('apps/web/src/app/coach/templates/new/page.tsx')
    const editCoachTemplate = readRepoFile('apps/web/src/app/coach/templates/[id]/edit/page.tsx')
    const coachOnboarding = readRepoFile('apps/web/src/app/onboarding/coach/page.tsx')
    const p2pOnboarding = readRepoFile('apps/web/src/app/onboarding/p2p/page.tsx')
    const nextConfig = readRepoFile('apps/web/next.config.js')

    expect(coachTemplates).toContain("redirect('/host/templates')")
    expect(newCoachTemplate).toContain("redirect('/host/templates')")
    expect(editCoachTemplate).toContain("redirect('/host/templates')")
    expect(coachOnboarding).toContain("redirect('/host')")
    expect(p2pOnboarding).toContain("redirect('/buddy')")
    expect(nextConfig).toContain("source: '/coach/templates/:path*'")
    expect(nextConfig).toContain("source: '/onboarding/coach'")
    expect(nextConfig).toContain("source: '/onboarding/p2p'")
  })

  it('resolves coach APIs through the database user identity', () => {
    const coachApiFiles = [
      'apps/web/src/app/api/coaches/apply/route.ts',
      'apps/web/src/app/api/coaches/verification/route.ts',
      'apps/web/src/app/api/coaches/templates/route.ts',
      'apps/web/src/app/api/coaches/templates/[id]/route.ts',
    ]

    for (const file of coachApiFiles) {
      const source = readRepoFile(file)
      expect(source).toContain('getCurrentDbUser')
      expect(source).not.toContain("from '@clerk/nextjs/server'")
    }
  })

  it('keeps profile links pointed at existing route families', () => {
    const profilePage = readRepoFile('apps/web/src/app/user/[slug]/page.tsx')

    expect(profilePage).toContain('/communities/${community.slug}')
    expect(profilePage).toContain('/activities/${event.id}')
    expect(profilePage).not.toContain('/community/${community.slug}')
    expect(profilePage).not.toContain('/events/${event.id}')
  })

  it('reserves spots before creating Stripe checkout sessions', () => {
    const marketplaceCheckout = readRepoFile(
      'apps/web/src/app/api/create-checkout-session/route.ts',
    )
    const p2pCheckout = readRepoFile('apps/web/src/app/api/buddy/sessions/[id]/join/route.ts')

    expect(marketplaceCheckout.indexOf('reservedBooking = await prisma.$transaction')).toBeLessThan(
      marketplaceCheckout.indexOf('stripe.checkout.sessions.create'),
    )
    expect(p2pCheckout.indexOf('userActivity = await prisma.$transaction')).toBeLessThan(
      p2pCheckout.indexOf('stripe.checkout.sessions.create'),
    )
  })

  it('keeps sunset route handlers centralized', () => {
    const sunsetRoute = readRepoFile('apps/web/src/lib/sunset-route.ts')
    const waveRoute = readRepoFile('apps/web/src/app/api/wave/route.ts')
    const organizerRoute = readRepoFile('apps/web/src/app/api/organizer/events/route.ts')
    const crewRoute = readRepoFile('apps/web/src/app/api/crew/route.ts')

    expect(sunsetRoute).toContain('status: 410')
    expect(waveRoute).toContain('createSunsetRoute')
    expect(organizerRoute).toContain('createSunsetRoute')
    expect(crewRoute).toContain('createSunsetRoute')
  })

  it('keeps stale pending reservation cleanup wired to cron', () => {
    expectRoute('apps/web/src/app/api/cron/expire-pending-reservations/route.ts')

    const dailyJobs = readRepoFile('apps/web/src/app/api/cron/daily-jobs/route.ts')
    expect(dailyJobs).toContain('expireStalePendingReservations')
  })

  it('keeps buddy session pagination aligned to the listing sort order', () => {
    const sessionsRoute = readRepoFile('apps/web/src/app/api/buddy/sessions/route.ts')
    const buddyPage = readRepoFile('apps/web/src/app/buddy/page.tsx')

    expect(sessionsRoute).toContain('function encodeSessionCursor')
    expect(sessionsRoute).toContain('isFeatured: session.isFeatured')
    expect(sessionsRoute).toContain('startTime: session.startTime.toISOString()')
    expect(sessionsRoute).toContain("{ isFeatured: 'desc' }")
    expect(sessionsRoute).toContain("{ startTime: 'asc' }")
    expect(sessionsRoute).toContain("{ id: 'asc' }")
    expect(sessionsRoute).toContain('encodeSessionCursor(items[items.length - 1])')
    expect(sessionsRoute).toContain('goingSolo: true')
    expect(sessionsRoute).toContain('goingSoloCount')
    expect(buddyPage).toContain('getSocialDiscoveryScore')
    expect(buddyPage).toContain('Math.min(session.attendeeCount')
  })

  it('keeps going-solo RSVP updates tied to the database user identity', () => {
    const goingSoloRoute = readRepoFile('apps/web/src/app/api/events/[eventId]/going-solo/route.ts')

    expect(goingSoloRoute).toContain('getCurrentDbUser')
    expect(goingSoloRoute).not.toContain("from '@clerk/nextjs/server'")
    expect(goingSoloRoute).toContain('body.goingSolo !== false')
    expect(goingSoloRoute).toContain("['JOINED', 'COMPLETED'].includes")
    expect(goingSoloRoute).toContain('userId: dbUser.id')
  })

  it('requires community manager role before creating community-backed sessions', () => {
    const sessionCreateRoute = readRepoFile('apps/web/src/app/api/buddy/sessions/create/route.ts')
    const templateCreateRoute = readRepoFile('apps/web/src/app/api/host/templates/route.ts')

    for (const source of [sessionCreateRoute, templateCreateRoute]) {
      expect(source).toContain('COMMUNITY_REQUIRED')
      expect(source).toContain("moderationStatus: 'LIVE'")
      expect(source).toContain("membership?.role !== 'OWNER' && membership?.role !== 'ADMIN'")
      expect(source).toContain('communityId: community.id')
      expect(source).toContain('COMMUNITY_FORBIDDEN')
      expect(source).toContain('MANAGER_VERIFICATION_REQUIRED')
      expect(source).toContain("managerTrustLevel !== 'VERIFIED_MANAGER'")
      expect(source).toContain("managerTrustLevel !== 'TRUSTED_MANAGER'")
    }
  })

  it('keeps community claims challenge-based instead of instant ownership', () => {
    const schema = readRepoFile('apps/web/prisma/schema.prisma')
    const claimRoute = readRepoFile('apps/web/src/app/api/communities/[slug]/claim/route.ts')
    const verifyRoute = readRepoFile(
      'apps/web/src/app/api/communities/[slug]/claim/verify/route.ts',
    )
    const claimButton = readRepoFile('apps/web/src/components/community/ClaimCommunityButton.tsx')
    const adminClaimsRoute = readRepoFile('apps/web/src/app/api/admin/community-claims/route.ts')
    const adminNominationsPage = readRepoFile('apps/web/src/app/admin/nominations/page.tsx')
    const nominatePage = readRepoFile('apps/web/src/app/communities/nominate/page.tsx')

    expect(schema).toContain('enum CommunityManagerTrustLevel')
    expect(schema).toContain('model CommunityClaim')
    expect(schema).toContain('model VerificationChallenge')
    expect(schema).toContain('managerTrustLevel')
    expect(claimRoute).toContain('verificationCode')
    expect(claimRoute).toContain('tx.verificationChallenge.create')
    expect(claimRoute).not.toContain('claimedAt: new Date()')
    expect(verifyRoute).toContain('fetchVerificationPage')
    expect(verifyRoute).toContain("managerTrustLevel: 'VERIFIED_MANAGER'")
    expect(verifyRoute).toContain("status: 'APPROVED'")
    expect(verifyRoute).toContain("moderationStatus: 'LIVE'")
    expect(claimButton).toContain('/claim/verify')
    expect(claimButton).toContain('verificationCode')
    expect(claimButton).toContain('Check verification')
    expect(adminClaimsRoute).toContain('isAdminRequest')
    expect(adminClaimsRoute).toContain('prisma.communityClaim.findMany')
    expect(adminNominationsPage).toContain('Manager claims')
    expect(nominatePage).toContain('New submissions stay queued')
    expect(nominatePage).not.toContain('Clean submissions go live immediately')
  })

  it('resolves community membership APIs through the database user identity', () => {
    const membershipRouteFiles = [
      'apps/web/src/app/api/communities/[slug]/join/route.ts',
      'apps/web/src/app/api/communities/[slug]/leave/route.ts',
      'apps/web/src/app/api/communities/[slug]/claim/route.ts',
      'apps/web/src/app/api/communities/[slug]/claim/verify/route.ts',
      'apps/web/src/app/api/communities/[slug]/route.ts',
      'apps/web/src/app/api/communities/[slug]/members/route.ts',
      'apps/web/src/app/api/communities/[slug]/chat/route.ts',
      'apps/web/src/app/api/communities/[slug]/announcements/route.ts',
      'apps/web/src/app/api/communities/[slug]/invites/route.ts',
      'apps/web/src/app/api/communities/mine/route.ts',
      'apps/web/src/app/api/community/follow/route.ts',
      'apps/web/src/app/api/user/communities/route.ts',
      'apps/web/src/app/communities/[slug]/page.tsx',
      'apps/web/src/app/hub/page.tsx',
    ]

    for (const file of membershipRouteFiles) {
      const source = readRepoFile(file)
      expect(source).toContain('getCurrentDbUser')
      expect(source).not.toContain("from '@clerk/nextjs/server'")
    }
  })

  it('keeps public-proxy mutating routes explicitly authenticated at the route layer', () => {
    const proxy = readRepoFile('apps/web/src/proxy.ts')

    expect(proxy).toContain('function isPublicApiRequest')
    expect(proxy).toContain('request.method.toUpperCase()')
    expect(proxy).toContain('const isPublicApi = isPublicApiRequest(request)')
    expect(proxy).toContain("pathname === '/api/buddy/sessions'")
    expect(proxy).not.toContain("'/api/buddy(.*)'")
    expect(proxy).not.toContain("'/api/host(.*)'")
    expect(proxy).not.toContain("'/api/user(.*)'")
    expect(proxy).not.toContain("'/api/communities(.*)'")
    expect(proxy).not.toContain("'/api/search(.*)'")
    expect(proxy).not.toContain("'/api/map(.*)'")

    const clerkUserRoutes = [
      'apps/web/src/app/api/buddy/block/route.ts',
      'apps/web/src/app/api/buddy/report/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/attendance/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/comment/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/comment/[commentId]/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/leave/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/notify/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/recap/route.ts',
      'apps/web/src/app/api/buddy/sessions/[id]/remove-attendee/route.ts',
      'apps/web/src/app/api/buddy/sessions/create/route.ts',
      'apps/web/src/app/api/buddy/sessions/feedback/route.ts',
      'apps/web/src/app/api/user/p2p-onboarding/route.ts',
      'apps/web/src/app/api/user/profile/route.ts',
      'apps/web/src/app/api/user/reliability/route.ts',
      'apps/web/src/app/api/user/set-referral/route.ts',
      'apps/web/src/app/api/user/stats/route.ts',
      'apps/web/src/app/api/host/templates/route.ts',
      'apps/web/src/app/api/host/templates/[templateId]/route.ts',
    ]

    for (const file of clerkUserRoutes) {
      const source = readRepoFile(file)
      expect(source).toContain("from '@clerk/nextjs/server'")
      expect(source).toContain('auth()')
      expect(source).toContain('Not authenticated')
    }

    const dbUserRoutes = [
      'apps/web/src/app/api/buddy/sessions/[id]/join/route.ts',
      'apps/web/src/app/api/community/follow/route.ts',
      'apps/web/src/app/api/communities/[slug]/announcements/route.ts',
      'apps/web/src/app/api/communities/[slug]/chat/route.ts',
      'apps/web/src/app/api/communities/[slug]/claim/route.ts',
      'apps/web/src/app/api/communities/[slug]/claim/verify/route.ts',
      'apps/web/src/app/api/communities/[slug]/invites/route.ts',
      'apps/web/src/app/api/communities/[slug]/join/route.ts',
      'apps/web/src/app/api/communities/[slug]/leave/route.ts',
      'apps/web/src/app/api/communities/[slug]/members/route.ts',
      'apps/web/src/app/api/communities/[slug]/route.ts',
      'apps/web/src/app/api/communities/mine/route.ts',
      'apps/web/src/app/api/user/communities/route.ts',
    ]

    for (const file of dbUserRoutes) {
      const source = readRepoFile(file)
      expect(source).toContain('getCurrentDbUser')
      expect(source).toContain('status: 401')
    }

    const cronRoutes = [
      'apps/web/src/app/api/cron/daily-jobs/route.ts',
      'apps/web/src/app/api/cron/process-waitlist/route.ts',
      'apps/web/src/app/api/cron/process-reminders/route.ts',
      'apps/web/src/app/api/cron/aggregate-stats/route.ts',
      'apps/web/src/app/api/cron/host-weekly-summary/route.ts',
    ]

    for (const file of cronRoutes) {
      const source = readRepoFile(file)
      expect(source).toContain('CRON_SECRET')
      expect(source).toContain('Unauthorized')
    }
  })

  it('keeps admin auth Clerk-only and avoids legacy logout/session success endpoints', () => {
    const adminAuthRoute = readRepoFile('apps/web/src/app/api/admin/auth/route.ts')
    const adminLayout = readRepoFile('apps/web/src/app/admin/layout.tsx')
    const adminRouteHelper = readRepoFile('apps/web/src/lib/admin-route.ts')
    const seededCommunitiesRoute = readRepoFile(
      'apps/web/src/app/api/admin/seeded-communities/route.ts',
    )

    expect(adminAuthRoute).toContain('isAdminRequest')
    expect(adminAuthRoute).toContain('Password admin login has been removed')
    expect(adminAuthRoute).toContain('Admin logout is handled by Clerk signOut')
    expect(adminAuthRoute).not.toContain('return NextResponse.json({ success: true })')
    expect(adminLayout).toContain('signOut')
    expect(adminLayout).toContain('/api/admin/auth')
    expect(adminRouteHelper).toContain('requireAdminRequest')
    expect(adminRouteHelper).toContain('isAdminRequest')
    expect(seededCommunitiesRoute).toContain('requireAdminRequest')
  })

  it('keeps production CSP from allowing unsafe eval', () => {
    const nextConfig = readRepoFile('apps/web/next.config.js')

    expect(nextConfig).toContain("const isProduction = process.env.NODE_ENV === 'production'")
    expect(nextConfig).toContain('const contentSecurityPolicy')
    expect(nextConfig).toContain("'unsafe-eval' https:")
    expect(nextConfig).toContain("? \"'self' 'unsafe-inline' https:\"")
  })

  it('keeps limited listings out of broad public discovery', () => {
    const publicDiscoveryFiles = [
      'apps/web/src/app/api/buddy/sessions/route.ts',
      'apps/web/src/app/api/search/route.ts',
      'apps/web/src/app/api/communities/route.ts',
      'apps/web/src/app/communities/page.tsx',
      'apps/web/src/app/api/discover/route.ts',
      'apps/web/src/app/page.tsx',
      'apps/web/src/app/api/map/events/route.ts',
      'apps/web/src/app/api/map/overview/route.ts',
      'apps/web/src/app/communities/[slug]/page.tsx',
      'apps/web/src/app/api/communities/[slug]/route.ts',
      'apps/web/src/app/api/cities/[slug]/route.ts',
      'apps/web/src/lib/community-system.ts',
    ]

    for (const file of publicDiscoveryFiles) {
      const source = readRepoFile(file)
      expect(source).toContain("moderationStatus: 'LIVE'")
      expect(source).not.toContain("['LIVE', 'LIMITED']")
    }
  })

  it('resolves admin community creation ownership through the database user identity', () => {
    const adminCommunityRouteFiles = [
      'apps/web/src/app/api/admin/communities/route.ts',
      'apps/web/src/app/api/admin/seed-community/route.ts',
    ]

    for (const file of adminCommunityRouteFiles) {
      const source = readRepoFile(file)
      expect(source).toContain('getCurrentDbUser')
      expect(source).not.toContain("from '@clerk/nextjs/server'")
      expect(source).not.toContain('createdById: userId')
    }
  })

  it('keeps community nomination ownership explicit', () => {
    const publicRoute = readRepoFile('apps/web/src/app/api/community-nominations/route.ts')
    const adminReviewRoute = readRepoFile(
      'apps/web/src/app/api/admin/community-nominations/[id]/route.ts',
    )

    expect(publicRoute).toContain('createNominationIfNew')
    expect(publicRoute).toContain('prisma.communityNomination.create')
    expect(publicRoute).not.toContain('prisma.communityNomination.upsert')
    expect(publicRoute).not.toContain('prisma.community.create')
    expect(adminReviewRoute).toContain('resolveCommunityCreatorId')
    expect(adminReviewRoute).toContain('clerkUserId: identifier')
    expect(publicRoute).toContain("moderationStatus: 'UNDER_REVIEW'")
    expect(adminReviewRoute).toContain('No admin user exists to own seeded communities')
    expect(publicRoute).not.toContain('prisma.user.findFirst')
    expect(publicRoute).not.toContain("orderBy: { createdAt: 'asc' }")
    expect(adminReviewRoute).not.toContain("orderBy: { createdAt: 'asc' }")
  })

  it('keeps admin community curation actions narrow and audited', () => {
    const source = readRepoFile('apps/web/src/app/api/admin/communities/[id]/curation/route.ts')

    expect(source).toContain('isAdminRequest')
    expect(source).toContain('logAdminAction')
    expect(source).toContain("'mark_verified'")
    expect(source).toContain("'mark_inactive'")
    expect(source).toContain("'mark_needs_verification'")
    expect(source).toContain("'update_official_link'")
    expect(source).toContain("'update_images'")
    expect(source).toContain(
      "OFFICIAL_LINK_FIELDS = new Set(['communityLink', 'websiteUrl', 'sourceUrl'])",
    )
    expect(source).not.toContain('deleteMany')
    expect(source).not.toContain('updateMany')
  })

  it('keeps root and active Vercel cron schedules aligned', () => {
    type VercelConfig = { crons?: { path: string; schedule: string }[] }
    const rootConfig = readRepoJson<VercelConfig>('vercel.json')
    const appConfig = readRepoJson<VercelConfig>('apps/web/vercel.json')

    const normalize = (crons: { path: string; schedule: string }[] = []) =>
      crons.map((cron) => `${cron.path} ${cron.schedule}`).sort()

    expect(normalize(appConfig.crons)).toEqual(normalize(rootConfig.crons))
    expect(normalize(appConfig.crons)).toContain('/api/cron/generate-recurring-sessions 0 2 * * *')
  })
})
