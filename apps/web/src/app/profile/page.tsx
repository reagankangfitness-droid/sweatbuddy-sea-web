'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import {
  ArrowLeft,
  User,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  BadgeCheck,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProfileData {
  slug: string | null
  isHost: boolean
  isCoach?: boolean
  coachVerificationStatus?: string | null
  bio: string | null
  fitnessLevel: string | null
  fitnessInterests: string[]
  sessionsHostedCount: number
  sessionsAttendedCount: number
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
            setProfile({
                slug: parsed.slug,
                isHost: parsed.isHost,
                bio: parsed.bio ?? null,
                fitnessLevel: parsed.fitnessLevel ?? null,
                fitnessInterests: parsed.fitnessInterests ?? [],
                sessionsHostedCount: parsed.sessionsHostedCount ?? 0,
                sessionsAttendedCount: parsed.sessionsAttendedCount ?? 0,
              })
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
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-neutral-700 rounded-full mb-4" />
          <div className="h-4 bg-neutral-700 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-950 border border-neutral-800"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-300" />
              </Link>
              <h1 className="text-lg font-semibold text-neutral-100">Profile</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-950 rounded-full border border-neutral-800 shadow-sm mb-6">
              <User className="w-12 h-12 text-neutral-300" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">Join SweatBuddies</h2>
            <p className="text-neutral-400 mb-8 max-w-xs mx-auto">
              Sign in to find sessions, join your crew, and keep track of your workouts.
            </p>

            <SignInButton mode="modal">
              <button className="w-full max-w-xs bg-neutral-900 py-4 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 transition-colors text-white">
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
  const isVerifiedCoach = profile?.isCoach && profile?.coachVerificationStatus === 'VERIFIED'

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Content */}
      <main className="pt-6 pb-24 px-4 max-w-lg mx-auto" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        {/* Profile Card */}
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-800 flex-shrink-0">
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
                    <User className="w-8 h-8 text-neutral-400" />
                  </div>
                )}
              </div>
              {isHost && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-neutral-700">
                  <BadgeCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-neutral-100 truncate">
                  {user?.fullName || user?.firstName || 'SweatBuddy'}
                </h2>
                {isHost && (
                  <span className="px-2 py-0.5 bg-amber-900 text-amber-400 text-xs font-medium rounded-full">
                    Host
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              {profile?.fitnessLevel && (
                <p className="text-xs text-neutral-400 mt-0.5 capitalize">
                  {profile.fitnessLevel.toLowerCase().replace('_', ' ')}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed border-t border-neutral-800 pt-4">
              {profile.bio}
            </p>
          )}

          {/* Fitness interests */}
          {profile?.fitnessInterests && profile.fitnessInterests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.fitnessInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full capitalize"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {profile && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 text-center">
              <p className="text-2xl font-bold text-neutral-100">{profile.sessionsAttendedCount}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Sessions Attended</p>
            </div>
            <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 text-center">
              <p className="text-2xl font-bold text-neutral-100">{profile.sessionsHostedCount}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Sessions Hosted</p>
            </div>
          </div>
        )}

        {/* My Activity Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1 mb-2">
            My Activity
          </h3>
          <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden">
            {isVerifiedCoach ? (
              <Link
                href="/host/dashboard"
                className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-900 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-neutral-200 text-sm font-medium">Coach Dashboard</span>
                    <p className="text-xs text-neutral-500">Manage sessions & students</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300" />
              </Link>
            ) : !profile?.isCoach ? (
              <Link
                href="/host/community"
                className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-900 rounded-lg flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-neutral-200 text-sm font-medium">Start a community</span>
                    <p className="text-xs text-neutral-500">Create and grow your fitness group</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300" />
              </Link>
            ) : null}

            <Link
              href="/communities?joined=true"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <span className="text-neutral-200 text-sm font-medium">My Communities</span>
                  <p className="text-xs text-neutral-500">Communities you&apos;ve joined</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </Link>

            <Link
              href="/buddy?tab=mine"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <span className="text-neutral-200 text-sm font-medium">My Sessions</span>
                  <p className="text-xs text-neutral-500">Sessions you&apos;re hosting or attending</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </Link>
          </div>
        </div>

        {/* Account Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1 mb-2">
            Account
          </h3>
          <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden">
            <Link
              href="/settings/profile"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-neutral-400" />
                </div>
                <span className="text-neutral-200 text-sm font-medium">Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-neutral-400" />
                </div>
                <span className="text-neutral-200 text-sm font-medium">Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </Link>

            <button
              onClick={() => signOut(() => router.push('/'))}
              className="w-full flex items-center px-4 py-3.5 text-neutral-400 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center">
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
