'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import { ArrowLeft, User, Settings, LogOut, ChevronRight, Flame, Trophy, LayoutDashboard, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [stats, setStats] = useState({ thisMonth: 0, totalAttended: 0 })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/stats')
        .then((res) => res.json())
        .then((data) => {
          setStats({
            thisMonth: data.thisMonth || 0,
            totalAttended: data.totalAttended || 0,
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
        {/* Profile Card - Tappable to edit */}
        <Link
          href="/settings/profile"
          className="block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-4 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-100 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || 'Profile'}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
                {user?.fullName || user?.firstName || 'SweatBuddy'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 dark:group-hover:text-neutral-500 transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isLoadingStats ? '-' : stats.thisMonth}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">This month</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isLoadingStats ? '-' : stats.totalAttended}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total attended</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <Link
            href="/host/dashboard"
            className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 text-sm font-medium">
              <LayoutDashboard className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              Host Dashboard
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
          </Link>

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
      </main>

      <div className="h-20" />
    </div>
  )
}
