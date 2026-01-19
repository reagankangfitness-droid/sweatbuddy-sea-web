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
  Flame,
  Trophy,
  Calendar,
  LayoutDashboard,
  HelpCircle,
  Ticket,
  Heart,
  CalendarDays,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProfileData {
  slug: string | null
  isHost: boolean
  username: string | null
}

interface Stats {
  thisMonth: number
  totalAttended: number
  upcoming: number
  profile: ProfileData | null
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    thisMonth: 0,
    totalAttended: 0,
    upcoming: 0,
    profile: null,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/stats')
        .then((res) => res.json())
        .then((data) => {
          setStats({
            thisMonth: data.thisMonth || 0,
            totalAttended: data.totalAttended || 0,
            upcoming: data.upcoming || 0,
            profile: data.profile || null,
          })
        })
        .catch(console.error)
        .finally(() => setIsLoadingStats(false))
    } else {
      setIsLoadingStats(false)
    }
  }, [isSignedIn])

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

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
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

        {/* Content */}
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

  const isHost = stats.profile?.isHost
  const profileSlug = stats.profile?.slug

  // Signed in - show profile
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
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

      {/* Content */}
      <main className="pt-20 pb-24 px-4">
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
              {/* Host Badge */}
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

          {/* View Public Profile & Edit */}
          <div className="flex gap-2 mt-4">
            {profileSlug ? (
              <Link
                href={`/user/${profileSlug}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Profile
              </Link>
            ) : null}
            <Link
              href="/settings/profile"
              className={`${profileSlug ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors`}
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats - 3 cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {isLoadingStats ? '-' : stats.thisMonth}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">This month</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {isLoadingStats ? '-' : stats.totalAttended}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {isLoadingStats ? '-' : stats.upcoming}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Upcoming</p>
          </div>
        </div>

        {/* My Activity Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 mb-2">
            My Activity
          </h3>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <Link
              href="/my-events"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <CalendarDays className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                My Events
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/my-bookings"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <Ticket className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                My Bookings
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/saved"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <Heart className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                Saved Events
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>
          </div>
        </div>

        {/* Host Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 mb-2">
            Hosting
          </h3>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <Link
              href="/host/dashboard"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <LayoutDashboard className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                Host Dashboard
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>
          </div>
        </div>

        {/* Account Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 mb-2">
            Account
          </h3>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <Link
              href="/settings/profile"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <Settings className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                Settings
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                <HelpCircle className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                Support
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
            </Link>

            <button
              onClick={() => signOut(() => router.push('/'))}
              className="w-full flex items-center justify-between px-4 py-3.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <LogOut className="w-5 h-5" />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </main>

      <div className="h-20" />
    </div>
  )
}
