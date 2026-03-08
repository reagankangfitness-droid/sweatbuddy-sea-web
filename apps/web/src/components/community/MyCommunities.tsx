'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Calendar, ChevronRight } from 'lucide-react'

interface FollowedCommunity {
  id: string
  name: string
  slug: string
  category: string
  logoImage: string | null
  hostName: string
  hostImageUrl: string | null
  instagramHandle: string | null
  nextEvent: {
    id: string
    name: string
    date: string | null
    time: string | null
    href: string
  } | null
}

export function MyCommunities() {
  const [communities, setCommunities] = useState<FollowedCommunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await fetch('/api/user/communities')
        if (res.ok) {
          const data = await res.json()
          setCommunities(data.communities || [])
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false)
      }
    }

    fetchCommunities()
  }, [])

  if (loading || communities.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
          <Users className="w-4 h-4" />
          My Communities
        </h2>
        <Link
          href="/communities"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {communities.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>
    </section>
  )
}

function CommunityCard({ community }: { community: FollowedCommunity }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Link
      href={`/communities/${community.slug}`}
      className="flex-shrink-0 w-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {community.hostImageUrl ? (
            <img
              src={community.hostImageUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-5 h-5 text-neutral-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-neutral-100 text-sm truncate">{community.name}</p>
          <p className="text-xs text-neutral-500 capitalize">{community.category}</p>
        </div>
      </div>

      {/* Next Event */}
      {community.nextEvent ? (
        <div className="bg-neutral-900 rounded-lg p-3">
          <p className="text-xs text-neutral-500 mb-1">Next event</p>
          <p className="text-sm font-medium text-neutral-200 truncate">
            {community.nextEvent.name}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
            <Calendar className="w-3 h-3" />
            {formatDate(community.nextEvent.date) || 'Date TBD'}
            {community.nextEvent.time && ` · ${community.nextEvent.time}`}
          </div>
          <Link
            href={community.nextEvent.href}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 block text-center text-xs font-medium py-1.5 bg-white text-neutral-900 rounded-full hover:bg-neutral-200 transition-colors"
          >
            RSVP
          </Link>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-lg p-3">
          <p className="text-xs text-neutral-500">No upcoming events</p>
        </div>
      )}
    </Link>
  )
}
