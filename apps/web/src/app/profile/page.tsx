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

  useEffect(() => {
    // Load counts from localStorage
    const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
    setSavedCount(saved.length)
    setGoingCount(going.length)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-forest-100 rounded-full mb-4" />
          <div className="h-4 bg-forest-100 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-sand">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-sand/95 backdrop-blur-lg border-b border-forest-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-cream border border-forest-200"
              >
                <ArrowLeft className="w-5 h-5 text-forest-700" />
              </Link>
              <h1 className="text-display-card">Profile</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-cream rounded-2xl border border-forest-100 shadow-card mb-6">
              <User className="w-12 h-12 text-forest-300" />
            </div>
            <h2 className="text-display-section mb-2">Join SweatBuddies</h2>
            <p className="text-body-default mb-8 max-w-xs mx-auto">
              Sign in to save events, track your fitness journey, and connect with your workout crew.
            </p>

            <SignInButton mode="modal">
              <button className="w-full max-w-xs bg-coral text-white py-4 text-ui-lg font-semibold rounded-full shadow-md hover:bg-coral-600 transition-colors">
                Sign In / Sign Up
              </button>
            </SignInButton>

            {/* Stats Preview - Neutral numbers */}
            <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-cream p-4 rounded-2xl border border-forest-100 shadow-card text-center">
                <span className="text-stat-sm block">{savedCount}</span>
                <span className="text-label-sm text-forest-500">SAVED</span>
              </div>
              <div className="bg-cream p-4 rounded-2xl border border-forest-100 shadow-card text-center">
                <span className="text-stat-sm block">{goingCount}</span>
                <span className="text-label-sm text-forest-500">GOING</span>
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
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-sand/95 backdrop-blur-lg border-b border-forest-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-cream border border-forest-200"
            >
              <ArrowLeft className="w-5 h-5 text-forest-700" />
            </Link>
            <h1 className="text-display-card">Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        {/* Profile Card */}
        <div className="bg-cream rounded-2xl border border-forest-100 shadow-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-forest-100 bg-sand">
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
                  <User className="w-8 h-8 text-forest-300" />
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
            className="bg-cream p-4 rounded-2xl border border-forest-100 shadow-card text-center block"
          >
            <Heart className="w-6 h-6 text-forest-400 mx-auto mb-2" />
            <span className="text-stat-sm block">{savedCount}</span>
            <span className="text-label-sm text-forest-500">SAVED</span>
          </Link>
          <div className="bg-cream p-4 rounded-2xl border border-forest-100 shadow-card text-center">
            <Calendar className="w-6 h-6 text-forest-400 mx-auto mb-2" />
            <span className="text-stat-sm block">{goingCount}</span>
            <span className="text-label-sm text-forest-500">GOING</span>
          </div>
        </div>

        {/* Menu Items - Neutral icons */}
        <div className="bg-cream rounded-2xl border border-forest-100 shadow-card overflow-hidden">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-4 border-b border-forest-100"
          >
            <span className="flex items-center gap-3 text-forest-800 text-ui">
              <Calendar className="w-5 h-5 text-forest-400" />
              My Dashboard
            </span>
            <ChevronRight className="w-5 h-5 text-forest-300" />
          </Link>

          <Link
            href="/saved"
            className="flex items-center justify-between px-4 py-4 border-b border-forest-100"
          >
            <span className="flex items-center gap-3 text-forest-800 text-ui">
              <Heart className="w-5 h-5 text-forest-400" />
              Saved Events
            </span>
            <ChevronRight className="w-5 h-5 text-forest-300" />
          </Link>

          <Link
            href="/settings/profile"
            className="flex items-center justify-between px-4 py-4 border-b border-forest-100"
          >
            <span className="flex items-center gap-3 text-forest-800 text-ui">
              <Settings className="w-5 h-5 text-forest-400" />
              Settings
            </span>
            <ChevronRight className="w-5 h-5 text-forest-300" />
          </Link>

          <button
            onClick={() => signOut(() => router.push('/'))}
            className="w-full flex items-center justify-between px-4 py-4 text-coral"
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
