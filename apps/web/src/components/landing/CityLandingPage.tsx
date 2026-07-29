import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { CityGuideTabs } from '@/components/city-guide/CityGuideTabs'
import { LandingIntentCapture } from '@/components/landing/LandingIntentCapture'
import { EVENTS } from '@/lib/analytics'

type RouteCard = {
  label: string
  image: string
  note: string
}

type HostBenefit = {
  label: string
  body: string
}

export type CityLandingPageProps = {
  city: string
  citySlug: string
  eyebrow: string
  title: string
  description: string
  heroImage: string
  heroAlt: string
  painIntro: string
  painTitle: string
  painBody: string
  routes: RouteCard[]
  moments: string[]
  hostTitle: string
  hostBody: string
  hostBenefits: HostBenefit[]
  finalTitle: string
  finalBody: string
}

export function CityLandingPage({
  city,
  citySlug,
  eyebrow,
  title,
  description,
  heroImage,
  heroAlt,
  painIntro,
  painTitle,
  painBody,
  routes,
  moments,
  hostTitle,
  hostBody,
  hostBenefits,
  finalTitle,
  finalBody,
}: CityLandingPageProps) {
  const trackingBase = { city, citySlug, experiment: 'two_city_newcomer_wedge' }
  const cityPlansHref = `/buddy?view=list&city=${citySlug}`
  const cityCommunitiesHref = `/communities?city=${citySlug}`

  return (
    <div className="sb-page">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0B0B]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="SweatBuddies home"
            className="inline-flex min-h-11 min-w-11 items-center"
          >
            <LogoWithText
              size={24}
              color="#FFFFFF"
              textColor="#FFFFFF"
              wordmarkClassName="max-[360px]:hidden"
            />
          </Link>
          <nav className="flex items-center gap-3">
            <TrackedLink
              href={cityCommunitiesHref}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: 'city_nav_communities',
                destination: cityCommunitiesHref,
                ...trackingBase,
              }}
              className="hidden min-h-11 items-center text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
            >
              Communities
            </TrackedLink>
            <LandingIntentCapture
              type="HOST"
              city={city}
              sourcePlacement="city_nav_host"
              ctaLabel={`Host a session in ${city}`}
              successHref="/host"
              aria-label="Host a session"
              className="sb-button-secondary min-h-9 px-3 py-2 text-xs min-[380px]:px-4 sm:text-sm"
            >
              <span aria-hidden="true" className="min-[380px]:hidden">Host</span>
              <span aria-hidden="true" className="hidden min-[380px]:inline">Host a session</span>
            </LandingIntentCapture>
          </nav>
        </div>
      </header>
      <CityGuideTabs active="communities" citySlug={citySlug} />

      <main className="overflow-x-hidden">
        <section className="relative overflow-hidden border-b border-white/[0.08] px-4 py-8 sm:py-12">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,11,0.96)_0%,rgba(11,11,11,0.82)_48%,rgba(11,11,11,0.35)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0B0B0B] to-transparent" />

          <div className="relative mx-auto grid min-h-[calc(100svh-190px)] max-w-6xl items-end gap-8 sm:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="max-w-3xl">
              <p className="sb-eyebrow mb-4">
                {eyebrow}
              </p>
              <h1 className="max-w-3xl text-3xl font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                {description}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Community-first', 'Source-checked', 'Solo-friendly'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                  >
                    <p className="truncate font-mono text-[9px] font-black uppercase tracking-wide text-white/58">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={cityCommunitiesHref}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'city_hero_communities',
                    destination: cityCommunitiesHref,
                    ...trackingBase,
                  }}
                  className="sb-button-primary px-6 py-3.5 text-sm"
                >
                  Browse communities <ArrowRight size={17} strokeWidth={2.4} />
                </TrackedLink>
                <TrackedLink
                  href={cityPlansHref}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'city_hero_plans',
                    destination: cityPlansHref,
                    ...trackingBase,
                  }}
                  className="sb-button-secondary px-6 py-3.5 text-sm"
                >
                  Find plans
                </TrackedLink>
              </div>
            </div>

            <div className="hidden rounded-lg border border-white/10 bg-[#111111]/78 p-4 shadow-2xl shadow-black/32 backdrop-blur lg:block">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#63FF8F]/84">
                Communities people can join
              </p>
              <div className="mt-4 space-y-3">
                {routes.slice(0, 3).map((route) => (
                  <TrackedLink
                    key={route.label}
                    href={cityCommunitiesHref}
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{
                      placement: 'city_hero_event_preview',
                      destination: cityCommunitiesHref,
                      label: route.label,
                      ...trackingBase,
                    }}
                    className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-2 transition-colors hover:border-[#63FF8F]/45"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-[#222222]">
                      <Image src={route.image} alt="" fill sizes="72px" className="object-cover" />
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="truncate text-sm font-black text-white">{route.label}</p>
                      <p className="mt-1 truncate text-xs text-white/55">{route.note}</p>
                      <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-wide text-[#63FF8F]">
                        View communities
                      </p>
                    </div>
                  </TrackedLink>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'Find the right room',
                body: painIntro,
              },
              {
                icon: ShieldCheck,
                title: 'Show up with context',
                body: 'See the host, location, price, group style, and first-timer expectations before you arrive.',
              },
              {
                icon: CalendarCheck,
                title: 'Repeat until it feels familiar',
                body: 'One plan gets you out. A recurring crew gives you people you can recognize next week.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <Icon size={22} strokeWidth={2.2} className="text-white/82" />
                  <h2 className="mt-5 text-base font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-[#0D0D0D] px-4 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
                Why this matters
              </p>
              <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {painTitle}
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-white/58">{painBody}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {moments.map((moment) => (
                <div
                  key={moment}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5"
                >
                  <p className="text-sm leading-6 text-white/68">{moment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
                  Start with one community
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
                  Pick the crew where meeting people feels natural.
                </h2>
              </div>
              <TrackedLink
                href={cityCommunitiesHref}
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{
                  placement: 'city_routes_communities_all',
                  destination: cityCommunitiesHref,
                  ...trackingBase,
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
              >
                See communities <ArrowRight size={16} />
              </TrackedLink>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {routes.map((route, index) => (
                <TrackedLink
                  key={route.label}
                  href={cityCommunitiesHref}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'city_route_card',
                    destination: cityCommunitiesHref,
                    label: route.label,
                    position: index + 1,
                    ...trackingBase,
                  }}
                  className="group relative min-h-[280px] overflow-hidden rounded-lg bg-[#171717]"
                >
                  <Image
                    src={route.image}
                    alt={route.label}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/58">
                      {route.note}
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold text-white">{route.label}</h3>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-[#F7F7F2] px-5 py-14 text-[#111111] sm:p-12 lg:p-16">
            <div className="mx-auto max-w-xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#4F8F46]">
                For hosts
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-[#111111] sm:text-4xl">
                {hostTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-black/65">{hostBody}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {hostBenefits.map((item, index) => {
                  const icons = [MapPin, MessageCircle, UsersRound]
                  const Icon = icons[index] ?? UsersRound
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-black/10 bg-white p-4 text-[#111111]"
                    >
                      <Icon size={19} strokeWidth={2.2} className="text-[#111111]" />
                      <p className="mt-4 text-xs font-extrabold leading-5 text-[#111111]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-black/62">{item.body}</p>
                    </div>
                  )
                })}
              </div>
              <LandingIntentCapture
                type="HOST"
                city={city}
                sourcePlacement="city_host_section"
                ctaLabel={`List your crew in ${city}`}
                successHref="/host"
                className="sb-button-primary mt-8 px-6 py-3.5 text-sm"
              >
                List your crew <ArrowRight size={17} />
              </LandingIntentCapture>
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden">
            <Image
              src="/images/hosts/run-club-group.jpg"
              alt="A local fitness community welcoming new people"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/65">
                Not nightlife. Not networking.
              </p>
              <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                A lower-pressure way to make {city} feel familiar.
              </h2>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
              Start this week
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {finalTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">{finalBody}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedLink
                href={cityCommunitiesHref}
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{
                  placement: 'city_final_browse',
                  destination: cityCommunitiesHref,
                  ...trackingBase,
                }}
                className="sb-button-primary px-7 py-3.5 text-sm"
              >
                Browse communities <ArrowRight size={17} />
              </TrackedLink>
              <TrackedLink
                href="/"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'city_final_home', destination: '/', ...trackingBase }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.06]"
              >
                Back to SweatBuddies
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
