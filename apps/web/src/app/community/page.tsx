'use client'

import { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { CommunityFeed } from '@/components/community/community-feed'

type Tab = 'all' | 'following'

export default function CommunityPage() {
  const { isSignedIn, user } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const currentUserId = isSignedIn ? (user?.id ?? null) : null

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Community
            </h1>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                All
              </button>

              {isSignedIn ? (
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  Following
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 transition-colors">
                    Following
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 pb-28">
        <CommunityFeed tab={activeTab} currentUserId={currentUserId} />
      </main>
    </div>
  )
}
