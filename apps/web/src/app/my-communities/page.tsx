'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar, Search, ChevronRight, Globe } from 'lucide-react'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  category: string
  memberCount: number
  eventCount: number
  role: string
  city?: { name: string } | null
}

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await fetch('/api/communities?joined=true')
        if (res.ok) {
          const data = await res.json()
          setCommunities(data.communities || [])
        }
      } catch (error) {
        console.error('Failed to fetch communities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCommunities()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <span className="text-4xl mb-4 block">🏠</span>
          <p className="text-neutral-400 dark:text-neutral-500">Loading communities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">My Communities</h1>
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">Communities you&apos;ve joined</p>
          </div>
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-full font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            Discover
          </Link>
        </div>

        {/* Communities List */}
        {communities.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No communities yet</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
              Join communities to connect with other fitness enthusiasts and discover events.
            </p>
            <Link
              href="/communities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              <Search className="w-5 h-5" />
              Discover Communities
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="flex items-center gap-4 p-4 sm:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {/* Cover Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  {community.coverImage ? (
                    <Image
                      src={community.coverImage}
                      alt={community.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                      {community.name}
                    </h3>
                    {community.role === 'OWNER' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                        Owner
                      </span>
                    )}
                    {community.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {community.city?.name || 'No city'} · {community.category}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                      <Users className="w-3.5 h-3.5" />
                      {community.memberCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {community.eventCount} events
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Spacer for mobile nav */}
      <div className="h-20" />
    </div>
  )
}
