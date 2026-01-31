'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar, Loader2, Search, ChevronRight } from 'lucide-react'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  category: string
  city: string
  memberCount: number
  eventCount: number
  role: string
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Communities</h1>
            <p className="text-neutral-500 mt-1">Communities you&apos;ve joined</p>
          </div>
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-600 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            Discover
          </Link>
        </div>

        {/* Communities List */}
        {communities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No communities yet</h2>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              Join communities to connect with other fitness enthusiasts and discover events.
            </p>
            <Link
              href="/communities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              <Search className="w-5 h-5" />
              Discover Communities
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="block bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex items-stretch">
                  {/* Cover Image */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-neutral-100 relative">
                    {community.coverImage ? (
                      <Image
                        src={community.coverImage}
                        alt={community.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {community.name}
                          </h3>
                          {community.role === 'OWNER' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              Owner
                            </span>
                          )}
                          {community.role === 'ADMIN' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {community.city} · {community.category}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <Users className="w-4 h-4" />
                        {community.memberCount}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        {community.eventCount} events
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
