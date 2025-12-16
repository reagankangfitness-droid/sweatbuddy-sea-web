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
          <div className="w-20 h-20 bg-navy/20 rounded-full mb-4" />
          <div className="h-4 bg-navy/20 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-sand">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-sand border-b-2 border-navy">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center border-2 border-navy bg-white"
                style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
              >
                <ArrowLeft className="w-5 h-5 text-navy" />
              </Link>
              <h1 className="font-display font-bold text-xl text-navy">Profile</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div
              className="inline-flex items-center justify-center w-24 h-24 bg-white border-2 border-navy mb-6"
              style={{ boxShadow: '4px 4px 0px 0px #E07A5F' }}
            >
              <User className="w-12 h-12 text-navy/30" />
            </div>
            <h2 className="font-display font-bold text-2xl text-navy mb-2">Join SweatBuddies</h2>
            <p className="text-navy/60 mb-8 max-w-xs mx-auto">
              Sign in to save events, track your fitness journey, and connect with your workout crew.
            </p>

            <SignInButton mode="modal">
              <button
                className="w-full max-w-xs bg-terracotta text-sand py-4 font-bold border-2 border-navy"
                style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
              >
                Sign In / Sign Up
              </button>
            </SignInButton>

            {/* Stats Preview */}
            <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div
                className="bg-white p-4 border-2 border-navy text-center"
                style={{ boxShadow: '3px 3px 0px 0px #4F46E5' }}
              >
                <span className="font-display text-2xl font-bold text-navy block">{savedCount}</span>
                <span className="text-xs text-navy/60">Saved Events</span>
              </div>
              <div
                className="bg-white p-4 border-2 border-navy text-center"
                style={{ boxShadow: '3px 3px 0px 0px #10B981' }}
              >
                <span className="font-display text-2xl font-bold text-navy block">{goingCount}</span>
                <span className="text-xs text-navy/60">Going To</span>
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-sand border-b-2 border-navy">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center border-2 border-navy bg-white"
              style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
            >
              <ArrowLeft className="w-5 h-5 text-navy" />
            </Link>
            <h1 className="font-display font-bold text-xl text-navy">Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        {/* Profile Card */}
        <div
          className="bg-white border-2 border-navy p-6 mb-6"
          style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-navy bg-sand">
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
                  <User className="w-8 h-8 text-navy/30" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-navy">
                {user?.fullName || user?.firstName || 'SweatBuddy'}
              </h2>
              <p className="text-sm text-navy/50">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/saved"
            className="bg-white p-4 border-2 border-navy text-center block"
            style={{ boxShadow: '3px 3px 0px 0px #E07A5F' }}
          >
            <Heart className="w-6 h-6 text-coral mx-auto mb-2" />
            <span className="font-display text-2xl font-bold text-navy block">{savedCount}</span>
            <span className="text-xs text-navy/60">Saved</span>
          </Link>
          <div
            className="bg-white p-4 border-2 border-navy text-center"
            style={{ boxShadow: '3px 3px 0px 0px #10B981' }}
          >
            <Calendar className="w-6 h-6 text-mint mx-auto mb-2" />
            <span className="font-display text-2xl font-bold text-navy block">{goingCount}</span>
            <span className="text-xs text-navy/60">Going</span>
          </div>
        </div>

        {/* Menu Items */}
        <div
          className="bg-white border-2 border-navy overflow-hidden"
          style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
        >
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-4 border-b border-navy/10"
          >
            <span className="flex items-center gap-3 text-navy font-medium">
              <Calendar className="w-5 h-5 text-terracotta" />
              My Dashboard
            </span>
            <ChevronRight className="w-5 h-5 text-navy/30" />
          </Link>

          <Link
            href="/saved"
            className="flex items-center justify-between px-4 py-4 border-b border-navy/10"
          >
            <span className="flex items-center gap-3 text-navy font-medium">
              <Heart className="w-5 h-5 text-terracotta" />
              Saved Events
            </span>
            <ChevronRight className="w-5 h-5 text-navy/30" />
          </Link>

          <Link
            href="/settings/profile"
            className="flex items-center justify-between px-4 py-4 border-b border-navy/10"
          >
            <span className="flex items-center gap-3 text-navy font-medium">
              <Settings className="w-5 h-5 text-terracotta" />
              Settings
            </span>
            <ChevronRight className="w-5 h-5 text-navy/30" />
          </Link>

          <button
            onClick={() => signOut(() => router.push('/'))}
            className="w-full flex items-center justify-between px-4 py-4 text-coral"
          >
            <span className="flex items-center gap-3 font-medium">
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
