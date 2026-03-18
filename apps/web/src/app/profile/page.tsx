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
      <div className="min-h-screen bg-[#FFFBF8] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-black/[0.06] rounded-full mb-4" />
          <div className="h-4 bg-black/[0.06] rounded-lg w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FFFBF8]">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-b border-black/[0.06]">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFFBF8] border border-black/[0.06]"
              >
                <ArrowLeft className="w-5 h-5 text-[#4A4A5A]" />
              </Link>
              <h1 className="text-lg font-semibold text-[#1A1A1A]">Profile</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full border border-black/[0.06] shadow-sm mb-6">
              <User className="w-12 h-12 text-[#9A9AAA]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Join SweatBuddies</h2>
            <p className="text-[#9A9AAA] mb-8 max-w-xs mx-auto">
              Find your crew, show up, and never work out alone again.
            </p>

            <SignInButton mode="modal">
              <button className="w-full max-w-xs bg-[#1A1A1A] py-4 text-base font-semibold rounded-full shadow-md hover:bg-black transition-colors text-white">
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
    <div className="min-h-screen bg-[#FFFBF8]">
      {/* Content */}
      <main className="pt-6 pb-24 px-4 max-w-lg mx-auto" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black/[0.06] bg-[#FFFBF8] flex-shrink-0">
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
                    <User className="w-8 h-8 text-[#9A9AAA]" />
                  </div>
                )}
              </div>
              {isHost && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                  <BadgeCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1A1A1A] truncate">
                  {user?.fullName || user?.firstName || 'SweatBuddy'}
                </h2>
                {isHost && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                    Host
                  </span>
                )}
              </div>
              <p className="text-sm text-[#9A9AAA] truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              {profile?.fitnessLevel && (
                <p className="text-xs text-[#9A9AAA] mt-0.5 capitalize">
                  {profile.fitnessLevel.toLowerCase().replace('_', ' ')}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-4 text-sm text-[#4A4A5A] leading-relaxed border-t border-black/[0.06] pt-4">
              {profile.bio}
            </p>
          )}

          {/* Fitness interests */}
          {profile?.fitnessInterests && profile.fitnessInterests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.fitnessInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 bg-[#FFFBF8] text-[#4A4A5A] text-xs rounded-full capitalize"
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
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{profile.sessionsAttendedCount}</p>
              <p className="text-xs text-[#9A9AAA] mt-0.5">Sessions Attended</p>
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{profile.sessionsHostedCount}</p>
              <p className="text-xs text-[#9A9AAA] mt-0.5">Sessions Hosted</p>
            </div>
          </div>
        )}

        {/* My Activity Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider px-1 mb-2">
            My Activity
          </h3>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <Link
              href="/host/dashboard"
              className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-[#1A1A1A] text-sm font-medium">Host Dashboard</span>
                  <p className="text-xs text-[#9A9AAA]">Manage sessions & attendees</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9A9AAA]" />
            </Link>

            <Link
              href="/communities?joined=true"
              className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFFBF8] rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#9A9AAA]" />
                </div>
                <div>
                  <span className="text-[#1A1A1A] text-sm font-medium">My Crews</span>
                  <p className="text-xs text-[#9A9AAA]">Your people</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9A9AAA]" />
            </Link>

            <Link
              href="/buddy?tab=mine"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFFBF8] rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-[#9A9AAA]" />
                </div>
                <div>
                  <span className="text-[#1A1A1A] text-sm font-medium">My Sessions</span>
                  <p className="text-xs text-[#9A9AAA]">Sessions you&apos;re hosting or attending</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9A9AAA]" />
            </Link>
          </div>
        </div>

        {/* Account Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider px-1 mb-2">
            Account
          </h3>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <Link
              href="/settings/profile"
              className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFFBF8] rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-[#9A9AAA]" />
                </div>
                <span className="text-[#1A1A1A] text-sm font-medium">Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9A9AAA]" />
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFFBF8] rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-[#9A9AAA]" />
                </div>
                <span className="text-[#1A1A1A] text-sm font-medium">Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9A9AAA]" />
            </Link>

            <button
              onClick={() => signOut(() => router.push('/'))}
              className="w-full flex items-center px-4 py-3.5 text-[#9A9AAA] hover:bg-[#FFFBF8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFFBF8] rounded-lg flex items-center justify-center">
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
