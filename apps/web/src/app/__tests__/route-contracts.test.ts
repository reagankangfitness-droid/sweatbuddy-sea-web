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
  it('keeps the public positioning centered on newcomer fitness crews in Singapore and Bangkok', () => {
    const homePage = readRepoFile('apps/web/src/app/page.tsx')
    const rootLayout = readRepoFile('apps/web/src/app/layout.tsx')
    const browsePage = readRepoFile('apps/web/src/app/browse/page.tsx')
    const communitiesPage = readRepoFile('apps/web/src/app/communities/page.tsx')
    const eventsPage = readRepoFile('apps/web/src/app/events/EventsPageClient.tsx')
    const eventsRoute = readRepoFile('apps/web/src/app/events/page.tsx')
    const buddyPage = readRepoFile('apps/web/src/app/buddy/page.tsx')
    const hostPage = readRepoFile('apps/web/src/app/host/page.tsx')
    const newcomerPage = readRepoFile('apps/web/src/app/new-to-singapore/page.tsx')
    const singaporePage = readRepoFile('apps/web/src/app/singapore/page.tsx')
    const bangkokPage = readRepoFile('apps/web/src/app/bangkok/page.tsx')
    const cityLanding = readRepoFile('apps/web/src/lib/city-landing.ts')
    const cityLandingComponent = readRepoFile('apps/web/src/components/landing/CityLandingPage.tsx')
    const proxy = readRepoFile('apps/web/src/proxy.ts')

    expect(homePage).toContain('Find friends through fitness.')
    expect(homePage).toContain('Join local crews across Singapore and Bangkok')
    expect(homePage).toContain('Bring first-timers in before they know who to ask.')
    expect(homePage).toContain('/singapore')
    expect(homePage).toContain('/bangkok')
    expect(homePage).toContain("experiment: 'two_city_newcomer_wedge'")
    expect(homePage).not.toContain('The OS for Fitness Community Leaders')
    expect(homePage).not.toContain('Your next crew is')

    expect(rootLayout).toContain('SweatBuddies | Find Friends Through Fitness')
    expect(rootLayout).toContain('Join local fitness crews across Singapore and Bangkok')
    expect(rootLayout).not.toContain('Discover Fitness & Wellness Experiences')
    expect(rootLayout).not.toContain('fitness and wellness experiences')

    expect(eventsRoute).toContain('Local Fitness Sessions Near You')
    expect(eventsRoute).not.toContain('Fitness Events Near You')
    expect(eventsPage).toContain('No upcoming sessions yet')
    expect(eventsPage).toContain('Start a session')

    expect(buddyPage).toContain('Search run clubs, yoga, pickleball, or neighborhoods')
    expect(buddyPage).toContain('Real crews moving nearby')
    expect(buddyPage).toContain('to meet people')
    expect(buddyPage).toContain('No local sessions yet.')
    expect(buddyPage).toContain('No crews or sessions for')

    expect(communitiesPage).toContain('Find local fitness communities near you')
    expect(browsePage).toContain('Find Local Fitness Sessions')
    expect(browsePage).toContain('Ready to stop showing up alone?')
    expect(hostPage).toContain('Stop running your community out of scattered DMs.')
    expect(hostPage).toContain('Stop using five tools to fill one session.')
    expect(hostPage).toContain('Ready to stop rebuilding attendance from scratch?')
    expect(hostPage).toContain('What do people show up for?')
    expect(hostPage).toContain('people nearby are actively looking')
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

  it('keeps public events wired to the active events API', () => {
    const eventsPage = readRepoFile('apps/web/src/app/events/EventsPageClient.tsx')
    const nextConfig = readRepoFile('apps/web/next.config.js')

    expect(eventsPage).toContain("fetch('/api/events')")
    expect(eventsPage).not.toContain('/api/wave')
    expect(nextConfig).not.toContain("source: '/events'")
  })

  it('keeps host routes reachable and growth backed by an API route', () => {
    const nextConfig = readRepoFile('apps/web/next.config.js')

    expect(nextConfig).not.toContain("source: '/host'")
    expect(nextConfig).not.toContain("source: '/host/:path*'")
    expectRoute('apps/web/src/app/api/host/growth/route.ts')
  })

  it('keeps logged-in host surfaces aligned around community growth', () => {
    const dashboardPage = readRepoFile('apps/web/src/app/host/dashboard/page.tsx')
    const communityPage = readRepoFile('apps/web/src/app/host/community/page.tsx')
    const growthPage = readRepoFile('apps/web/src/app/host/growth/page.tsx')
    const planPage = readRepoFile('apps/web/src/app/host/plan/page.tsx')
    const onboarding = readRepoFile('apps/web/src/components/host/HostOnboarding.tsx')
    const emptyState = readRepoFile('apps/web/src/components/host/EmptyState.tsx')
    const planner = readRepoFile('apps/web/src/components/host/AIPlannerChat.tsx')
    const pulseCard = readRepoFile('apps/web/src/components/host/WeeklyPulseCard.tsx')

    expect(dashboardPage).toContain('Run the sessions people come back to.')
    expect(dashboardPage).toContain('Plan Next Session')
    expect(dashboardPage).toContain('WeeklyPulseCard')
    expect(communityPage).toContain('Regulars & Community Health')
    expect(communityPage).toContain('Invite Regulars')
    expect(growthPage).toContain('Community Growth')
    expect(planPage).toContain('Plan Your Next Session')
    expect(onboarding).toContain('What type of community are you building?')
    expect(emptyState).toContain('No live sessions yet')
    expect(planner).toContain('Community Session Planner')
    expect(pulseCard).toContain('Community Pulse')
  })

  it('keeps coach template action links backed by pages', () => {
    expectRoute('apps/web/src/app/coach/templates/new/page.tsx')
    expectRoute('apps/web/src/app/coach/templates/[id]/edit/page.tsx')
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

    expect(sessionsRoute).toContain('function encodeSessionCursor')
    expect(sessionsRoute).toContain('isFeatured: session.isFeatured')
    expect(sessionsRoute).toContain('startTime: session.startTime.toISOString()')
    expect(sessionsRoute).toContain("{ isFeatured: 'desc' }")
    expect(sessionsRoute).toContain("{ startTime: 'asc' }")
    expect(sessionsRoute).toContain("{ id: 'asc' }")
    expect(sessionsRoute).toContain('encodeSessionCursor(items[items.length - 1])')
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
