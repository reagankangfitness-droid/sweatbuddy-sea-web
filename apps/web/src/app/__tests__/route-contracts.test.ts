import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '../..')

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function expectRoute(relativePath: string) {
  expect(existsSync(path.join(repoRoot, relativePath))).toBe(true)
}

describe('route contracts', () => {
  it('keeps the public positioning centered on friends through local fitness communities', () => {
    const homePage = readRepoFile('apps/web/src/app/page.tsx')
    const rootLayout = readRepoFile('apps/web/src/app/layout.tsx')
    const browsePage = readRepoFile('apps/web/src/app/browse/page.tsx')
    const communitiesPage = readRepoFile('apps/web/src/app/communities/page.tsx')
    const eventsPage = readRepoFile('apps/web/src/app/events/EventsPageClient.tsx')
    const eventsRoute = readRepoFile('apps/web/src/app/events/page.tsx')
    const buddyPage = readRepoFile('apps/web/src/app/buddy/page.tsx')
    const hostPage = readRepoFile('apps/web/src/app/host/page.tsx')

    expect(homePage).toContain('Find your people through')
    expect(homePage).toContain('local fitness.')
    expect(homePage).toContain('Join run clubs, yoga groups, pickleball crews')
    expect(homePage).toContain('Grow your fitness community without managing everything in DMs.')
    expect(homePage).not.toContain('The OS for Fitness Community Leaders')
    expect(homePage).not.toContain('Your next crew is')

    expect(rootLayout).toContain('SweatBuddies | Find Friends Through Local Fitness')
    expect(rootLayout).toContain('Find friends through local fitness communities')
    expect(rootLayout).not.toContain('Discover Fitness & Wellness Experiences')
    expect(rootLayout).not.toContain('fitness and wellness experiences')

    expect(eventsRoute).toContain('Local Fitness Communities Near You')
    expect(eventsRoute).not.toContain('Fitness Events Near You')
    expect(eventsPage).toContain('No upcoming sessions yet')
    expect(eventsPage).toContain('Start a community session')

    expect(buddyPage).toContain('Search crews, sessions, or neighborhoods')
    expect(buddyPage).toContain('No local sessions yet.')
    expect(buddyPage).toContain('No crews or sessions for')

    expect(communitiesPage).toContain('Find local fitness communities near you')
    expect(browsePage).toContain('Find Local Fitness Sessions')
    expect(browsePage).toContain('Ready to find your people?')
    expect(hostPage).toContain('What community are you building?')
    expect(hostPage).toContain('grow your regulars')
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
    const marketplaceCheckout = readRepoFile('apps/web/src/app/api/create-checkout-session/route.ts')
    const p2pCheckout = readRepoFile('apps/web/src/app/api/buddy/sessions/[id]/join/route.ts')

    expect(marketplaceCheckout.indexOf('reservedBooking = await prisma.$transaction')).toBeLessThan(
      marketplaceCheckout.indexOf('stripe.checkout.sessions.create')
    )
    expect(p2pCheckout.indexOf('userActivity = await prisma.$transaction')).toBeLessThan(
      p2pCheckout.indexOf('stripe.checkout.sessions.create')
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
})
