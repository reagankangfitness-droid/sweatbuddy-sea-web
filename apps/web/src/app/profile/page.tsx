'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import {
  ArrowLeft,
  User,
  Settings,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Ticket,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  PenTool,
  TrendingUp,
  MessageSquare,
  Heart,
  HelpCircle,
  Radio,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProfileData {
  slug: string | null
  isHost: boolean
}

// Cache key for localStorage
const PROFILE_CACHE_KEY = 'sb_profile_cache'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // Initialize from cache for instant render
  const [profile, setProfile] = useState<ProfileData | null>(null)

  // Load cache on mount (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const cached = localStorage.getItem(PROFILE_CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          // Validate cache belongs to current user
          if (parsed._userId === user.id) {
            setProfile({ slug: parsed.slug, isHost: parsed.isHost })
          }
        }
      } catch {}
    }
  }, [user?.id])

  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Fetch in background, don't block render (lightweight endpoint)
      fetch('/api/user/profile')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        })
        .then((data) => {
          const profileData = data.profile || null
          setProfile(profileData)
          // Cache with user ID for validation
          if (profileData) {
            try {
              localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
                ...profileData,
                _userId: user.id,
              }))
            } catch {}
          }
        })
        .catch(() => {
          // On error, clear potentially stale cache
          setProfile(null)
        })
    } else if (isLoaded && !isSignedIn) {
      // Clear cache on sign out
      try {
        localStorage.removeItem(PROFILE_CACHE_KEY)
      } catch {}
      setProfile(null)
    }
  }, [isSignedIn, isLoaded, user?.id])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-4" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </Link>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Profile</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border border-neutral-100 dark:border-neutral-700 shadow-sm mb-6">
              <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Join SweatBuddies</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xs mx-auto">
              Sign in to track your fitness journey and connect with your workout crew.
            </p>

            <SignInButton mode="modal">
              <button className="w-full max-w-xs bg-neutral-900 dark:bg-white py-4 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-white dark:text-neutral-900">
                Sign In / Sign Up
              </button>
            </SignInButton>
          </div>
        </main>

        <div className="h-20" />
      </div>
    )
  }

  const isHost = profile?.isHost

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/app"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 pb-24 px-4 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                  </div>
                )}
              </div>
              {isHost && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                  <BadgeCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                  {user?.fullName || user?.firstName || 'SweatBuddy'}
                </h2>
                {isHost && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                    Host
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* AI Tools Showcase - For Hosts */}
        {isHost && (
          <div className="mb-4">
            <div className="bg-neutral-900 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-800 dark:border-neutral-700 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-700/30 rounded-full blur-3xl -mr-16 -mt-16" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-neutral-800 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-white">AI Assistant</h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold">NEW</span>
                  </div>
                </div>

                <p className="text-neutral-400 text-xs mb-4">
                  Your personal AI to help grow your fitness community
                </p>

                {/* AI Tool Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/host/content"
                    className="bg-neutral-800 dark:bg-neutral-700/50 hover:bg-neutral-700 dark:hover:bg-neutral-600/50 rounded-xl p-3 text-center transition-colors border border-neutral-700 dark:border-neutral-600"
                  >
                    <div className="w-8 h-8 bg-neutral-700 dark:bg-neutral-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <PenTool className="w-4 h-4 text-neutral-300" />
                    </div>
                    <p className="text-xs font-medium text-white">Content</p>
                    <p className="text-[10px] text-neutral-500">Generator</p>
                  </Link>

                  <Link
                    href="/host/growth"
                    className="bg-neutral-800 dark:bg-neutral-700/50 hover:bg-neutral-700 dark:hover:bg-neutral-600/50 rounded-xl p-3 text-center transition-colors border border-neutral-700 dark:border-neutral-600"
                  >
                    <div className="w-8 h-8 bg-neutral-700 dark:bg-neutral-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-4 h-4 text-neutral-300" />
                    </div>
                    <p className="text-xs font-medium text-white">Growth</p>
                    <p className="text-[10px] text-neutral-500">Insights</p>
                  </Link>

                  <Link
                    href="/host/dashboard"
                    className="bg-neutral-800 dark:bg-neutral-700/50 hover:bg-neutral-700 dark:hover:bg-neutral-600/50 rounded-xl p-3 text-center transition-colors border border-neutral-700 dark:border-neutral-600"
                  >
                    <div className="w-8 h-8 bg-neutral-700 dark:bg-neutral-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-4 h-4 text-neutral-300" />
                    </div>
                    <p className="text-xs font-medium text-white">AI Chat</p>
                    <p className="text-[10px] text-neutral-500">Ask anything</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Activity Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-2">
            My Activity
          </h3>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <Link
              href="/my-activities"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">My Activities</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Activities you&apos;ve started</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/my-bookings"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">My Bookings</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Upcoming & past events</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/saved"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">Saved</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Events you&apos;ve saved</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/crews"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">My Crews</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Communities you&apos;ve joined</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>
          </div>
        </div>

        {/* Host Tools Section - Only show for non-hosts or when AI Tools not shown */}
        {!isHost && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-2">
              Host Tools
            </h3>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <Link
                href="/host/dashboard"
                className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">Host Dashboard</span>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage events & community</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
              </Link>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-2">
            Account
          </h3>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <Link
              href="/settings/profile"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <button
              onClick={() => signOut(() => router.push('/'))}
              className="w-full flex items-center px-4 py-3.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      <div className="h-20" />
    </div>
  )
}
