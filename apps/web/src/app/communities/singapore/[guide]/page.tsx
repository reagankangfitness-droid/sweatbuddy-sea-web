import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import { CommunityWeeklyPicksForm } from '@/components/community/CommunityDirectoryActions'
import { getCategoryEmoji } from '@/lib/categories'
import { getCommunityDirectory, getCommunityJoinReadiness } from '@/lib/community-directory'
import {
  COMMUNITY_SEO_GUIDES,
  filterCommunitiesForSeoGuide,
  getCommunitySeoGuide,
} from '@/lib/community-seo-guides'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'
import type { CommunityData } from '@/app/communities/CommunitiesPageClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ guide: string }>
}

export function generateStaticParams() {
  return COMMUNITY_SEO_GUIDES.map((guide) => ({ guide: guide.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide: guideSlug } = await params
  const guide = getCommunitySeoGuide(guideSlug)
  if (!guide) return { title: 'Fitness Communities' }

  return {
    title: guide.title,
    description: guide.metaDescription,
    openGraph: {
      title: `${guide.title} | SweatBuddies`,
      description: guide.metaDescription,
      url: `https://www.sweatbuddies.co/communities/singapore/${guide.slug}`,
    },
  }
}

export default async function SingaporeCommunityGuidePage({ params }: PageProps) {
  const { guide: guideSlug } = await params
  const guide = getCommunitySeoGuide(guideSlug)
  if (!guide) notFound()

  const communities = await getCommunityDirectory()
  const guideCommunities = filterCommunitiesForSeoGuide(communities, guide)
  if (guideCommunities.length === 0) notFound()

  const beginnerCount = guideCommunities.filter((community) => community.beginnerFriendly).length
  const soloCount = guideCommunities.filter((community) => community.soloFriendly).length

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/communities"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/52 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#63FF8F]">
                {guide.eyebrow}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                {guide.headline}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-base">
                {guide.intro}
              </p>
              <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                {guideCommunities.length} communities · {beginnerCount} beginner-friendly · {soloCount} solo-friendly
              </p>
            </div>
            <CommunityWeeklyPicksForm
              source="seo"
              city="Singapore"
              activityType={guide.filterLabel}
              title={guide.ctaLabel}
              body="Get a short weekly shortlist with official join links."
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guideCommunities.map((community) => (
            <GuideCommunityCard key={community.slug} community={community} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-white/42">
            Related searches
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {guide.relatedSearches.map((search) => (
              <Link
                key={search}
                href="/communities"
                className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-3 text-xs font-black uppercase tracking-wide text-white/62 transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
              >
                {search}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function GuideCommunityCard({ community }: { community: CommunityData }) {
  const readiness = getCommunityJoinReadiness(community)
  const image = community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#151515]">
      <Link href={`/communities/${community.slug}`} className="group relative block aspect-[16/10] bg-[#222222]">
        <Image
          src={image}
          alt={community.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          unoptimized={!image.startsWith('/')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-black/10" />
        <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
          {getCategoryEmoji(community.category)} {community.category.replace(/_/g, ' ')}
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-[#63FF8F] backdrop-blur">
          {readiness.score >= 80 ? 'High confidence' : 'Source checked'}
        </span>
      </Link>
      <div className="p-4">
        <h2 className="line-clamp-2 text-lg font-bold leading-tight text-white">{community.name}</h2>
        <div className="mt-2 grid gap-1 text-xs font-semibold text-white/50">
          <p className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#63FF8F]" />
            <span className="truncate">{community.usualArea || community.cityName || 'Area TBA'}</span>
          </p>
          <p className="truncate">{community.usualSchedule || 'Schedule varies'}</p>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[40px] text-sm leading-5 text-white/62">
          {community.bestFor || community.description || 'Source-checked community listing.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {readiness.strengths.slice(0, 3).map((strength) => (
            <span key={strength} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/64">
              <CheckCircle2 className="h-3 w-3 text-[#63FF8F]" />
              {strength}
            </span>
          ))}
        </div>
        <Link
          href={`/communities/${community.slug}`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-4 text-sm font-black text-black transition-colors hover:bg-[#83FFA6]"
        >
          View join details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
