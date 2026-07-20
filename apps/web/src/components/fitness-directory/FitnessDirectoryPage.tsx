import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { CityGuideTabs } from '@/components/city-guide/CityGuideTabs'
import { PlaceCoverImage } from '@/components/fitness-directory/PlaceCoverImage'
import {
  fitnessDirectoryCategories,
  formatPlaceType,
  getDirectoryAreas,
  getDirectoryStats,
  getDirectoryVibes,
  getFitnessPlacePositioning,
  getFitnessPlacesForCategory,
  humanizeDirectoryTag,
  type FitnessDirectoryCategorySlug,
  type FitnessPlace,
} from '@/lib/fitness-directory'
import { getFitnessDirectoryPlaces } from '@/lib/fitness-place-store'

interface FitnessDirectoryPageProps {
  categorySlug: FitnessDirectoryCategorySlug
  searchParams?: {
    q?: string
    area?: string
    vibe?: string
    beginner?: string
    trust?: string
  }
}

function buildFilterHref(
  pathname: string,
  params: FitnessDirectoryPageProps['searchParams'],
  updates: Record<string, string | null>,
) {
  const next = new URLSearchParams()
  if (params?.q) next.set('q', params.q)
  if (params?.area) next.set('area', params.area)
  if (params?.vibe) next.set('vibe', params.vibe)
  if (params?.beginner) next.set('beginner', params.beginner)
  if (params?.trust) next.set('trust', params.trust)

  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }

  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

function placeMatchesTrust(place: FitnessPlace, trust?: string) {
  if (!trust) return true
  if (trust === 'official') return Boolean(place.websiteUrl)
  if (trust === 'reviews') return place.reviewCount > 0 || (place.googleReviewCount ?? 0) > 0
  if (trust === 'community') return getFitnessPlacePositioning(place).socialSignal !== 'None'
  return true
}

function getTrustLabel(place: FitnessPlace) {
  if (place.websiteUrl) return 'Official link'
  if (place.reviewCount > 0) return `${place.reviewCount} reviews`
  if (place.sourceProvider) return `${place.sourceProvider} source`
  return 'Directory listing'
}

function PlaceCard({ place }: { place: FitnessPlace }) {
  const positioning = getFitnessPlacePositioning(place)
  const rating = place.googleRating ?? place.averageRating
  const primaryTags = [
    positioning.joinPath,
    positioning.socialSignal !== 'None' ? `${positioning.socialSignal} signal` : null,
    positioning.intent === 'generic_inventory' ? formatPlaceType(place.placeType) : null,
  ].filter(Boolean)

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#111111]">
      <Link href={`/places/${place.slug}`} className="group block">
        <div className="relative aspect-[16/10] bg-white/[0.04]">
          <PlaceCoverImage
            src={place.coverImage}
            alt=""
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/16 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-black uppercase tracking-wide text-[#63FF8F]">
                {place.area}
              </p>
              <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-white">
                {place.name}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 font-mono text-xs font-black text-black">
              <Star size={13} fill="currentColor" />
              {rating > 0 ? rating.toFixed(1) : 'New'}
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#63FF8F] px-2.5 py-1 text-[11px] font-black text-black">
            {positioning.publicPriority}
          </span>
          {primaryTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-bold text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/64">{positioning.reason}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-white/[0.04] p-2">
            <p className="font-mono font-black uppercase tracking-wide text-white/36">Who it suits</p>
            <p className="mt-1 line-clamp-2 font-semibold text-white/76">{place.bestFor}</p>
          </div>
          <div className="rounded-md bg-white/[0.04] p-2">
            <p className="font-mono font-black uppercase tracking-wide text-white/36">Join path</p>
            <p className="mt-1 line-clamp-2 font-semibold text-white/76">
              {positioning.joinPath}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="min-w-0 text-xs text-white/46">
            {getTrustLabel(place)} · Show-up score {positioning.score}
          </div>
          <Link
            href={`/places/${place.slug}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-black uppercase tracking-wide text-[#63FF8F]"
          >
            View <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export async function FitnessDirectoryPage({ categorySlug, searchParams }: FitnessDirectoryPageProps) {
  const category =
    fitnessDirectoryCategories.find((item) => item.slug === categorySlug) ??
    fitnessDirectoryCategories[0]
  const pathname = category.href
  const directoryPlaces = await getFitnessDirectoryPlaces()
  const places = getFitnessPlacesForCategory(category.slug, {
    query: searchParams?.q,
    area: searchParams?.area,
    vibe: searchParams?.vibe,
    beginner: searchParams?.beginner === '1',
  }, directoryPlaces).filter((place) => placeMatchesTrust(place, searchParams?.trust))
  const allCategoryPlaces = getFitnessPlacesForCategory(category.slug, {}, directoryPlaces)
  const stats = getDirectoryStats(allCategoryPlaces)
  const areas = getDirectoryAreas(allCategoryPlaces)
  const vibes = getDirectoryVibes(allCategoryPlaces).slice(0, 12)
  const hasFilters = Boolean(
    searchParams?.q || searchParams?.area || searchParams?.vibe || searchParams?.beginner || searchParams?.trust,
  )

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white md:pl-14">
      <header className="border-b border-white/10 bg-[#0B0B0B]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" aria-label="SweatBuddies home" className="inline-flex min-h-11 min-w-11 items-center">
            <LogoWithText
              size={28}
              color="#FFFFFF"
              textColor="#FFFFFF"
              wordmarkClassName="max-[360px]:hidden"
            />
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <Link
              href="/communities"
              className="hidden min-h-10 items-center rounded-full border border-white/12 px-3 text-xs font-black uppercase tracking-wide text-white/62 transition-colors hover:border-white/28 hover:text-white sm:inline-flex"
            >
              Communities
            </Link>
            <Link
              href="/communities/nominate"
              className="inline-flex min-h-10 items-center rounded-full bg-[#63FF8F] px-3 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#83FFA6]"
            >
              Submit a place
            </Link>
          </nav>
        </div>
      </header>
      <CityGuideTabs active="places" />

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:py-14">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#63FF8F]">
                SweatBuddies city guide
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  {category.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                {category.searchIntent}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <StatBlock label="Places" value={stats.places} />
              <StatBlock label="Activities" value={stats.activities} />
              <StatBlock label="Areas" value={stats.areas} />
              <StatBlock label="Social picks" value={stats.socialPlaces} />
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {fitnessDirectoryCategories.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={`inline-flex min-h-11 min-w-0 shrink-0 items-center rounded-full px-3 text-xs font-black uppercase tracking-wide transition-colors ${
                    item.slug === category.slug
                      ? 'bg-white text-black'
                      : 'border border-white/12 text-white/62 hover:border-white/28 hover:text-white'
                  }`}
                >
                  {item.shortTitle}
                </Link>
              ))}
            </div>

            <form action={pathname} className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/36"
                />
                <input
                  name="q"
                  defaultValue={searchParams?.q ?? ''}
                  placeholder="Search by activity, area, crew, or first-timer fit..."
                  className="min-h-12 w-full rounded-lg border border-white/12 bg-[#111111] pl-10 pr-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/32 focus:border-[#63FF8F]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#63FF8F] px-5 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#83FFA6]"
              >
                <Search size={16} />
                Search
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-[154px]">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <SlidersHorizontal size={17} className="text-[#63FF8F]" />
              <p className="font-mono text-xs font-black uppercase tracking-wide text-white/62">
                Filters
              </p>
              {hasFilters ? (
                <Link
                  href={pathname}
                  className="ml-auto text-xs font-bold text-white/46 underline decoration-white/20 underline-offset-4 hover:text-white"
                >
                  Clear
                </Link>
              ) : null}
            </div>

            <FilterGroup title="Area">
              {areas.map((area) => (
                <FilterLink
                  key={area}
                  href={buildFilterHref(pathname, searchParams, {
                    area: searchParams?.area === area ? null : area,
                  })}
                  active={searchParams?.area === area}
                >
                  {area}
                </FilterLink>
              ))}
            </FilterGroup>

            <FilterGroup title="Vibe">
              {vibes.map((vibe) => (
                <FilterLink
                  key={vibe}
                  href={buildFilterHref(pathname, searchParams, {
                    vibe: searchParams?.vibe === vibe ? null : vibe,
                  })}
                  active={searchParams?.vibe === vibe}
                >
                  {humanizeDirectoryTag(vibe)}
                </FilterLink>
              ))}
            </FilterGroup>

            <FilterGroup title="Fit">
              <FilterLink
                href={buildFilterHref(pathname, searchParams, {
                  beginner: searchParams?.beginner === '1' ? null : '1',
                })}
                active={searchParams?.beginner === '1'}
              >
                Beginner-friendly
              </FilterLink>
            </FilterGroup>

            <FilterGroup title="Trust">
              <FilterLink
                href={buildFilterHref(pathname, searchParams, {
                  trust: searchParams?.trust === 'official' ? null : 'official',
                })}
                active={searchParams?.trust === 'official'}
              >
                Official website
              </FilterLink>
              <FilterLink
                href={buildFilterHref(pathname, searchParams, {
                  trust: searchParams?.trust === 'reviews' ? null : 'reviews',
                })}
                active={searchParams?.trust === 'reviews'}
              >
                Has reviews
              </FilterLink>
              <FilterLink
                href={buildFilterHref(pathname, searchParams, {
                  trust: searchParams?.trust === 'community' ? null : 'community',
                })}
                active={searchParams?.trust === 'community'}
              >
                Community signal
              </FilterLink>
            </FilterGroup>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-black uppercase tracking-wide text-white/36">
                  {places.length} result{places.length === 1 ? '' : 's'}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                  Listings ranked by show-up value
                </h2>
              </div>
              <Link
                href="/communities"
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-white/12 px-3 text-xs font-black uppercase tracking-wide text-white/66 transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
              >
                <Users size={15} />
                Browse communities
              </Link>
            </div>

            {places.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {places.map((place) => (
                  <PlaceCard key={place.slug} place={place} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                <Sparkles className="mx-auto text-[#63FF8F]" size={28} />
                <h2 className="mt-4 text-xl font-black">No matching places yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/54">
                  Try a broader search or submit a place so the directory can add it to this city guide.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="font-mono text-2xl font-black text-white">{value}</p>
      <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-wide text-white/42">
        {label}
      </p>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-white/10 py-4">
      <p className="mb-2 font-mono text-[11px] font-black uppercase tracking-wide text-white/36">
        {title}
      </p>
      <div className="flex flex-wrap gap-2 lg:block lg:space-y-1.5">{children}</div>
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-bold transition-colors lg:w-full lg:justify-between lg:rounded-md ${
        active
          ? 'bg-[#63FF8F] text-black'
          : 'border border-white/10 text-white/62 hover:border-white/24 hover:text-white'
      }`}
    >
      <span>{children}</span>
      {active ? <CheckCircle2 size={14} /> : null}
    </Link>
  )
}
