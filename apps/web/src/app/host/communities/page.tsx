'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Users, Calendar, Settings, ChevronRight, Loader2 } from 'lucide-react'

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
  isVerified: boolean
  createdAt: string
}

export default function HostCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await fetch('/api/communities?owned=true')
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
            <p className="text-neutral-500 mt-1">Manage your fitness communities</p>
          </div>
          <Link
            href="/host/communities/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Community
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
              Create your first community to start building your fitness tribe and hosting events.
            </p>
            <Link
              href="/host/communities/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Community
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex items-stretch">
                  {/* Cover Image */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-neutral-100 relative">
                    {community.coverImage ? (
                      <Image
                        src={community.coverImage}
                        alt={community.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {community.name}
                          </h3>
                          {community.isVerified && (
                            <span className="text-blue-500 text-sm">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {community.city} · {community.category}
                        </p>
                      </div>
                      <Link
                        href={`/host/communities/${community.slug}`}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                    </div>

                    {community.description && (
                      <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                        {community.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-auto pt-3">
                      <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <Users className="w-4 h-4" />
                        {community.memberCount} members
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        {community.eventCount} events
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="hidden sm:flex items-center pr-4">
                    <Link
                      href={`/host/communities/${community.slug}`}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      Manage
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
