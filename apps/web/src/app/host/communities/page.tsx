'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Users, Calendar, ChevronRight, Globe } from 'lucide-react'
import { DashboardHeader } from '@/components/host/DashboardHeader'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  category: string
  memberCount: number
  eventCount: number
  city?: { name: string } | null
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
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <DashboardHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-pulse">
            <span className="text-4xl mb-4 block">🏠</span>
            <p className="text-neutral-400 dark:text-neutral-500">Loading communities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              Your Communities
            </h1>
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">
              Manage your fitness communities
            </p>
          </div>
          <Link
            href="/host/communities/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold text-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Community</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Communities List */}
        {communities.length === 0 ? (
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 sm:p-12 text-center bg-white dark:bg-neutral-900">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              No communities yet
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
              Create a community to organize your events and build your tribe.
            </p>
            <Link
              href="/host/communities/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Community
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/host/communities/${community.slug}`}
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
                  <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                    {community.name}
                  </h3>
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
      </main>
    </div>
  )
}
