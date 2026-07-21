import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Star,
  Users,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import {
  getFitnessPlacePositioning,
  humanizeDirectoryTag,
} from '@/lib/fitness-directory'
import { getFitnessDirectoryPlaceBySlug } from '@/lib/fitness-place-store'

export const dynamic = 'force-dynamic'

interface PlacePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params
  const place = await getFitnessDirectoryPlaceBySlug(slug)

  if (!place) return { title: 'Place Not Found' }

  return {
    title: place.name,
    description: `${place.description} See reviews, photos, vibe, amenities, and related fitness communities.`,
    openGraph: {
      title: place.name,
      description: place.bestFor,
      images: [place.coverImage],
    },
  }
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params
  const place = await getFitnessDirectoryPlaceBySlug(slug)

  if (!place) notFound()

  const categoryHref = place.placeType === 'gym'
    ? '/singapore/gyms'
    : place.placeType === 'studio' || place.placeType === 'wellness'
      ? '/singapore/studios'
      : place.placeType === 'sports_facility'
        ? '/singapore/sports'
        : place.activities.includes('running') || place.activities.includes('run_club')
          ? '/singapore/run-clubs'
          : '/singapore/outdoor-fitness'
  const positioning = getFitnessPlacePositioning(place)
  const sourceConfidenceScore = place.trustScore || place.socialScore
  const relatedPlansHref = `/buddy?location=nearby&type=${encodeURIComponent(place.activities[0] || place.placeType)}`

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
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
          <Link
            href="/singapore"
            className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-3 text-xs font-black uppercase tracking-wide text-white/62 transition-colors hover:border-white/28 hover:text-white"
          >
            Singapore guide
          </Link>
        </div>
      </header>

      <main>
        <section className="relative border-b border-white/10">
          <div className="absolute inset-0">
            <Image src={place.coverImage} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/68" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/52 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:py-9 lg:py-10">
            <Link
              href={categoryHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-black/28 px-3 text-xs font-black uppercase tracking-wide text-white/72 backdrop-blur transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
            >
              <ArrowLeft size={15} />
              Back to guide
            </Link>

            <div className="mt-14 max-w-4xl sm:mt-24 lg:mt-36">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#63FF8F] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-wide text-black">
                  {positioning.joinPath}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/16 bg-black/28 px-3 py-1.5 font-mono text-xs font-black uppercase tracking-wide text-white/78 backdrop-blur">
                  <MapPin size={13} />
                  {place.area}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
                {place.name}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                {positioning.reason}
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {place.websiteUrl ? (
                  <a
                    href={place.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-5 text-sm font-black text-black transition-colors hover:bg-[#83FFA6]"
                  >
                    Open official link
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <Link
                    href={relatedPlansHref}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-5 text-sm font-black text-black transition-colors hover:bg-[#83FFA6]"
                  >
                    Find related plans
                    <ArrowRight size={16} />
                  </Link>
                )}
                {place.googleMapsUrl ? (
                  <a
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-5 text-sm font-black text-white/78 backdrop-blur transition-colors hover:border-white/34 hover:text-white"
                  >
                    Get directions
                    <ExternalLink size={16} />
                  </a>
                ) : null}
                {!place.websiteUrl ? (
                  <Link
                    href="/communities/nominate"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-5 text-sm font-black text-white/78 backdrop-blur transition-colors hover:border-white/34 hover:text-white"
                  >
                    Suggest source
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <HeroMetric label="Show-up score" value={positioning.score} detail={positioning.publicPriority} />
                <HeroMetric label="Social signal" value={positioning.socialSignal} detail={positioning.intent.replace(/_/g, ' ')} />
                <HeroMetric label="Trust score" value={sourceConfidenceScore} detail="Source confidence" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-7 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            {place.aiSummary ? (
              <Section title="SweatBuddies Read">
                <div className="rounded-lg border border-[#63FF8F]/24 bg-[#102016] p-4">
                  <p className="text-sm leading-6 text-white/72">{place.aiSummary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SignalList title="Good signals" items={place.aiPros || []} tone="positive" />
                    <SignalList title="Check before going" items={place.aiCons || []} tone="caution" />
                  </div>
                </div>
              </Section>
            ) : null}

            <Section title="Can I Join?">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBlock title="Join path" body={positioning.joinPath} />
                <InfoBlock title="Who it suits" body={place.bestFor} />
                <InfoBlock title="Why it ranks" body={positioning.reason} />
              </div>
            </Section>

            <Section title="Why Go">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock title="Best for" body={place.bestFor} />
                <InfoBlock title="Best times" body={place.bestTimes} />
                <InfoBlock title="Price" body={place.priceSummary} />
                <InfoBlock title="Trial" body={place.trialSummary} />
              </div>
            </Section>

            <Section title="Photos">
              <div className="grid gap-3 sm:grid-cols-3">
                {place.photos.slice(0, 6).map((photo) => (
                  <div key={photo} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white/[0.04]">
                    <Image src={photo} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Reviews">
              {place.reviewHighlights.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {place.reviewHighlights.map((review) => (
                  <article key={review.title} className="rounded-lg border border-white/10 bg-[#111111] p-4">
                    <div className="flex items-center gap-1 text-[#63FF8F]">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <h3 className="mt-3 text-lg font-black">{review.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/62">{review.quote}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {review.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-white/58">
                          {humanizeDirectoryTag(tag)}
                        </span>
                      ))}
                    </div>
                  </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
                  <h3 className="text-lg font-black">Community reviews are being collected</h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    This place was imported from a public source. SweatBuddies-specific reviews and
                    vibe checks will appear after people submit updates.
                  </p>
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-lg border border-[#63FF8F]/30 bg-[#63FF8F]/10 p-4">
              <h2 className="font-mono text-xs font-black uppercase tracking-wide text-[#63FF8F]">
                Trust & source
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <TrustRow label="Listing source" value={sourceLabel(place)} />
                <TrustRow label="Trust score" value={`${sourceConfidenceScore}/100`} />
                <TrustRow label="Public reviews" value={reviewSourceValue(place)} />
                <TrustRow label="Photo signal" value={`${place.photoQualityScore || 0}/100`} />
                <TrustRow label="Official link" value={place.websiteUrl ? 'Available' : 'Not added yet'} />
                <TrustRow label="Last enriched" value={formatVerifiedDate(place.lastEnrichedAt || place.lastVerifiedAt)} />
                <TrustRow label="Public priority" value={positioning.publicPriority} />
              </div>
              <div className="mt-4 grid gap-2">
                {place.websiteUrl ? (
                  <a
                    href={place.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#63FF8F] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#83FFA6]"
                  >
                    Official website
                    <ExternalLink size={15} />
                  </a>
                ) : null}
                {place.googleMapsUrl ? (
                  <a
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/12 px-4 text-xs font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
                  >
                    Google Maps
                    <ExternalLink size={15} />
                  </a>
                ) : null}
                {place.sourceUrl ? (
                  <a
                    href={place.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/12 px-4 text-xs font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
                  >
                    View public source
                    <ExternalLink size={15} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
              <h2 className="font-mono text-xs font-black uppercase tracking-wide text-white/42">
                Fit Snapshot
              </h2>
              <div className="mt-4 space-y-3">
                <SnapshotRow label="Beginner-friendly" active={place.beginnerFriendly} />
                <SnapshotRow label="Drop-in friendly" active={place.dropInFriendly} />
                <SnapshotRow label="Community energy" active={positioning.socialSignal !== 'None'} />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
              <h2 className="font-mono text-xs font-black uppercase tracking-wide text-white/42">
                Activities
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {place.activities.map((activity) => (
                  <span key={activity} className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-white/68">
                    {humanizeDirectoryTag(activity)}
                  </span>
                ))}
              </div>
            </div>

            {place.openingHours && place.openingHours.length > 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
                <h2 className="font-mono text-xs font-black uppercase tracking-wide text-white/42">
                  Public hours
                </h2>
                <div className="mt-3 space-y-1">
                  {place.openingHours.slice(0, 7).map((line) => (
                    <p key={line} className="text-xs leading-5 text-white/58">{line}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
              <h2 className="font-mono text-xs font-black uppercase tracking-wide text-white/42">
                Communities Here
              </h2>
              <div className="mt-3 space-y-3">
                {place.relatedCommunities.length > 0 ? place.relatedCommunities.map((community) => (
                  <Link key={community.name} href={community.href} className="block rounded-md bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{community.name}</p>
                      <ArrowRight size={15} className="text-[#63FF8F]" />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/52">{community.relationship}</p>
                  </Link>
                )) : (
                  <p className="rounded-md bg-white/[0.04] p-3 text-sm leading-6 text-white/56">
                    No linked communities yet. Imported places can be connected to communities as
                    events and claims come in.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
              <h2 className="font-mono text-xs font-black uppercase tracking-wide text-white/42">
                Events here
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/56">
                We are connecting listings to live sessions as hosts and communities claim them.
              </p>
              <Link
                href={relatedPlansHref}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/12 px-4 text-xs font-black uppercase tracking-wide text-white/70 transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
              >
                See related events
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="rounded-lg border border-[#63FF8F]/30 bg-[#63FF8F]/10 p-4">
              <h2 className="text-lg font-black">Own or host here?</h2>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Add photos, update details, or connect the communities that regularly use this space.
              </p>
              <Link
                href="/communities/nominate"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#63FF8F] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#83FFA6]"
              >
                Submit updates
                <ExternalLink size={15} />
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function HeroMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/32 p-3 backdrop-blur">
      <p className="font-mono text-[10px] font-black uppercase tracking-wide text-white/42">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/56">{detail}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-black tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-[#63FF8F]" />
        <p className="font-mono text-xs font-black uppercase tracking-wide text-white/42">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/72">{body}</p>
    </div>
  )
}

function SignalList({ title, items, tone }: { title: string; items: string[]; tone: 'positive' | 'caution' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/18 p-3">
      <p className="font-mono text-xs font-black uppercase tracking-wide text-white/42">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-white/68">
              <span className={tone === 'positive' ? 'text-[#63FF8F]' : 'text-white/42'}>-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-5 text-white/50">More source data needed.</p>
      )}
    </div>
  )
}

function SnapshotRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-white/66">{label}</span>
      {active ? (
        <CheckCircle2 size={18} className="text-[#63FF8F]" />
      ) : (
        <Users size={18} className="text-white/28" />
      )}
    </div>
  )
}

function TrustRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0 last:pb-0">
      <span className="font-semibold text-white/56">{label}</span>
      <span className="max-w-[11rem] truncate text-right font-bold text-white">{value}</span>
    </div>
  )
}

function ratingValue(place: { googleRating?: number | null; averageRating: number }) {
  const rating = place.googleRating || place.averageRating
  return rating > 0 ? rating.toFixed(1) : 'New'
}

function ratingDetail(place: { googleReviewCount?: number; reviewCount: number }) {
  const publicReviews = place.googleReviewCount || 0
  if (publicReviews > 0) return `${publicReviews} public reviews`
  if (place.reviewCount > 0) return `${place.reviewCount} SweatBuddies reviews`
  return 'Reviews pending'
}

function reviewSourceValue(place: { googleReviewCount?: number; reviewCount: number }) {
  if ((place.googleReviewCount || 0) > 0) return `${place.googleReviewCount} Google`
  if (place.reviewCount > 0) return `${place.reviewCount} local`
  return 'Pending'
}

function sourceLabel(place: {
  sourceProvider?: string | null
  websiteUrl?: string | null
  googleMapsUrl?: string | null
}) {
  if (place.googleMapsUrl) return 'Google Places matched'
  if (place.websiteUrl) return 'Official website linked'
  if (place.sourceProvider === 'OSM') return 'OpenStreetMap'
  if (place.sourceProvider) return place.sourceProvider.replace(/_/g, ' ')
  return 'SweatBuddies'
}

function formatVerifiedDate(value?: string | null) {
  if (!value) return 'Pending review'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Pending review'
  }
}
