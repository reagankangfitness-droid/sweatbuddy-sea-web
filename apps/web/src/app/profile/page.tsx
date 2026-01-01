'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import { ArrowLeft, User, Calendar, Heart, Settings, LogOut, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [savedCount, setSavedCount] = useState(0)
  const [goingCount, setGoingCount] = useState(0)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    // Load saved count from localStorage (client-side only)
    const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    setSavedCount(saved.length)

    // Fetch going count from API for logged-in users
    if (isSignedIn) {
      fetch('/api/user/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.goingCount !== undefined) {
            setGoingCount(data.goingCount)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingStats(false))
    } else {
      // Fallback to localStorage for non-logged-in users
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      setGoingCount(going.length)
      setIsLoadingStats(false)
    }
  }, [isSignedIn])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-neutral-100 rounded-full mb-4" />
          <div className="h-4 bg-neutral-100 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </Link>
              <h1 className="text-display-card">Profile</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl border border-neutral-100 shadow-card mb-6">
              <User className="w-12 h-12 text-neutral-300" />
            </div>
            <h2 className="text-display-section mb-2">Join SweatBuddies</h2>
            <p className="text-body-default mb-8 max-w-xs mx-auto">
              Sign in to save events, track your fitness journey, and connect with your workout crew.
            </p>

            <SignInButton mode="modal">
              <button className="w-full max-w-xs bg-neutral-900 py-4 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 transition-colors" style={{ color: '#FFFFFF' }}>
                Sign In / Sign Up
              </button>
            </SignInButton>

            {/* Stats Preview - Neutral numbers */}
            <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-card text-center">
                <span className="text-stat-sm block">{savedCount}</span>
                <span className="text-label-sm text-neutral-500">SAVED</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-card text-center">
                <span className="text-stat-sm block">{goingCount}</span>
                <span className="text-label-sm text-neutral-500">GOING</span>
              </div>
            </div>
          </div>
        </main>

        <div className="h-20" />
      </div>
    )
  }

  // Signed in - show profile
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <h1 className="text-display-card">Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 bg-neutral-50">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || 'Profile'}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-neutral-300" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-display-card">
                {user?.fullName || user?.firstName || 'SweatBuddy'}
              </h2>
              <p className="text-meta-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        {/* Stats - Neutral icons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/saved"
            className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-card text-center block"
          >
            <Heart className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
            <span className="text-stat-sm block">{savedCount}</span>
            <span className="text-label-sm text-neutral-500">SAVED</span>
          </Link>
          <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-card text-center">
            <Calendar className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
            <span className="text-stat-sm block">{goingCount}</span>
            <span className="text-label-sm text-neutral-500">GOING</span>
          </div>
        </div>

        {/* Menu Items - Neutral icons */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
          <Link
            href="/host/dashboard"
            className="flex items-center justify-between px-4 py-4 border-b border-neutral-100"
          >
            <span className="flex items-center gap-3 text-neutral-800 text-ui">
              <Calendar className="w-5 h-5 text-neutral-400" />
              Host Dashboard
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-300" />
          </Link>

          <Link
            href="/saved"
            className="flex items-center justify-between px-4 py-4 border-b border-neutral-100"
          >
            <span className="flex items-center gap-3 text-neutral-800 text-ui">
              <Heart className="w-5 h-5 text-neutral-400" />
              Saved Events
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-300" />
          </Link>

          <Link
            href="/settings/profile"
            className="flex items-center justify-between px-4 py-4 border-b border-neutral-100"
          >
            <span className="flex items-center gap-3 text-neutral-800 text-ui">
              <Settings className="w-5 h-5 text-neutral-400" />
              Settings
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-300" />
          </Link>

          <button
            onClick={() => signOut(() => router.push('/'))}
            className="w-full flex items-center justify-between px-4 py-4 text-neutral-900"
          >
            <span className="flex items-center gap-3 text-ui">
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
