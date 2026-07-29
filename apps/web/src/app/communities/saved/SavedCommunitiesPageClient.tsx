'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookmarkX, MapPin } from 'lucide-react'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'
import type { CommunityData } from '@/app/communities/CommunitiesPageClient'
import { CommunityWeeklyPicksForm } from '@/components/community/CommunityDirectoryActions'

const SAVED_KEY = 'sweatbuddies_saved_communities'

interface SavedCommunitiesPageClientProps {
  communities: CommunityData[]
}

export default function SavedCommunitiesPageClient({
  communities,
}: SavedCommunitiesPageClientProps) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([])

  useEffect(() => {
    setSavedSlugs(readSavedSlugs())
  }, [])

  const savedCommunities = useMemo(
    () => communities.filter((community) => savedSlugs.includes(community.slug)),
    [communities, savedSlugs],
  )

  function removeSaved(slug: string) {
    const next = savedSlugs.filter((item) => item !== slug)
    setSavedSlugs(next)
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next))
    } catch {}
  }

  return (
    <main className="min-h-screen bg-[#0B0D0C] px-4 py-6 pb-24 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/communities"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/52 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to communities
        </Link>

        <section className="mt-8 grid gap-4 border-b border-white/10 pb-7 md:grid-cols-[minmax(0,1fr)_340px] md:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#C6E76A]">
              Saved communities
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your shortlist for showing up.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">
              Keep the groups you are considering in one place. Open a page when you are ready to check the official join path.
            </p>
          </div>
          <CommunityWeeklyPicksForm source="saved" />
        </section>

        {savedCommunities.length > 0 ? (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedCommunities.map((community) => (
              <SavedCommunityCard
                key={community.slug}
                community={community}
                onRemove={() => removeSaved(community.slug)}
              />
            ))}
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-[#151816] md:grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[220px] bg-[#222222]">
              <Image
                src="/images/community-bonds.jpg"
                alt="People gathered after a fitness session"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151816] via-black/10 to-transparent md:bg-gradient-to-r" />
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                Nothing saved yet
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
                Save communities while you compare.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/58">
                Use the save button on directory cards or community detail pages to build a shortlist.
              </p>
              <Link
                href="/communities"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#C6E76A] px-4 text-sm font-black text-black transition-colors hover:bg-[#D8F18A]"
              >
                Browse communities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function SavedCommunityCard({
  community,
  onRemove,
}: {
  community: CommunityData
  onRemove: () => void
}) {
  const image = community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#151816]">
      <Link href={`/communities/${community.slug}`} className="group relative block aspect-[16/10] bg-[#222222]">
        <Image
          src={image}
          alt={community.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          unoptimized={!image.startsWith('/')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-black/10" />
        <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-[#C6E76A] backdrop-blur">
          {community.communityLink || community.websiteUrl ? 'Official link found' : 'Source checked'}
        </span>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-bold text-white">{community.name}</h2>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/44">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{community.usualArea || community.cityName || 'Area TBA'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/12 text-white/45 transition-colors hover:border-red-400/50 hover:text-red-300"
            aria-label={`Remove ${community.name} from saved communities`}
          >
            <BookmarkX className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[40px] text-sm leading-5 text-white/62">
          {community.bestFor || community.description || 'Source-checked community listing.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            community.usualSchedule,
            community.beginnerFriendly ? 'Beginner-friendly' : null,
            community.soloFriendly ? 'Solo-friendly' : null,
          ].filter(Boolean).slice(0, 3).map((chip) => (
            <span key={chip} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/64">
              {chip}
            </span>
          ))}
        </div>
        <Link
          href={`/communities/${community.slug}`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#C6E76A] px-4 text-sm font-black text-black transition-colors hover:bg-[#D8F18A]"
        >
          View details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function readSavedSlugs() {
  try {
    const value = window.localStorage.getItem(SAVED_KEY)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
