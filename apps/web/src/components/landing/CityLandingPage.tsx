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
  const cityPlansHref = `/buddy?city=${citySlug}`

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0B0B0B]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-5 py-4">
          <Link
            href="/"
            aria-label="SweatBuddies home"
            className="inline-flex min-h-11 min-w-11 items-center"
          >
            <LogoWithText
              size={28}
              color="#FFFFFF"
              textColor="#FFFFFF"
              wordmarkClassName="max-[360px]:hidden"
            />
          </Link>
          <nav className="flex items-center gap-3">
            <TrackedLink
              href={cityPlansHref}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: 'city_nav_browse',
                destination: cityPlansHref,
                ...trackingBase,
              }}
              className="hidden min-h-11 items-center text-sm font-medium text-white/65 transition-colors hover:text-white sm:inline-flex"
            >
              Find plans
            </TrackedLink>
            <LandingIntentCapture
              type="HOST"
              city={city}
              sourcePlacement="city_nav_host"
              ctaLabel={`Host a session in ${city}`}
              successHref="/host"
              className="min-h-11 rounded-full bg-[#63FF8F] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#83FFA6] min-[380px]:px-4 sm:text-sm"
            >
              <span className="min-[380px]:hidden">Host</span>
              <span className="hidden min-[380px]:inline">Host a session</span>
            </LandingIntentCapture>
          </nav>
        </div>
      </header>
      <CityGuideTabs active="events" citySlug={citySlug} />

      <main className="overflow-x-hidden">
        <section className="relative overflow-hidden border-b border-white/[0.08] px-5 py-10 sm:py-14">
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

          <div className="relative mx-auto grid min-h-[calc(100svh-220px)] max-w-6xl items-end gap-8 sm:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#63FF8F]">
                {eyebrow}
              </p>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/78 sm:text-lg">
                {description}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Events nearby', 'People going', 'Solo-friendly'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2.5"
                  >
                    <p className="truncate font-mono text-[10px] font-black uppercase tracking-wide text-white/72">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={cityPlansHref}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'city_hero_browse',
                    destination: cityPlansHref,
                    ...trackingBase,
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-7 py-4 text-sm font-bold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#33E66C]"
                >
                  Find plans <ArrowRight size={17} strokeWidth={2.4} />
                </TrackedLink>
                <LandingIntentCapture
                  type="HOST"
                  city={city}
                  sourcePlacement="city_hero_host"
                  ctaLabel={`Host a session in ${city}`}
                  successHref="/host"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
                >
                  Host a session
                </LandingIntentCapture>
              </div>
            </div>

            <div className="hidden rounded-xl border border-white/12 bg-[#111111]/85 p-4 shadow-2xl shadow-black/40 backdrop-blur lg:block">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
                Plans people can join
              </p>
              <div className="mt-4 space-y-3">
                {routes.slice(0, 3).map((route) => (
                  <TrackedLink
                    key={route.label}
                    href={cityPlansHref}
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{
                      placement: 'city_hero_event_preview',
                      destination: cityPlansHref,
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
                        View sessions
                      </p>
                    </div>
                  </TrackedLink>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
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
                  className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5"
                >
                  <Icon size={22} strokeWidth={2.2} className="text-white/82" />
                  <h2 className="mt-5 text-base font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-[#0D0D0D] px-5 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
                Why this matters
              </p>
              <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
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

        <section className="px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
                  Start with one plan
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Pick the room where meeting people feels natural.
                </h2>
              </div>
              <TrackedLink
                href={cityPlansHref}
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{
                  placement: 'city_routes_browse_all',
                  destination: cityPlansHref,
                  ...trackingBase,
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
              >
                See all plans <ArrowRight size={16} />
              </TrackedLink>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {routes.map((route, index) => (
                <TrackedLink
                  key={route.label}
                  href={cityPlansHref}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'city_route_card',
                    destination: cityPlansHref,
                    label: route.label,
                    position: index + 1,
                    ...trackingBase,
                  }}
                  className="group relative min-h-[330px] overflow-hidden rounded-lg bg-[#171717]"
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
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-5xl">
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
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-7 py-4 text-sm font-bold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#33E66C]"
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
              <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                A lower-pressure way to make {city} feel familiar.
              </h2>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
              Start this week
            </p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {finalTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">{finalBody}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedLink
                href={cityPlansHref}
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{
                  placement: 'city_final_browse',
                  destination: cityPlansHref,
                  ...trackingBase,
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#33E66C]"
              >
                Find a session <ArrowRight size={17} />
              </TrackedLink>
              <TrackedLink
                href="/"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'city_final_home', destination: '/', ...trackingBase }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.06]"
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
