'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

/**
 * Organizer page now redirects to unified Clerk auth with host intent.
 * Previous magic link auth is deprecated in favor of single sign-on.
 */
export default function OrganizerPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      // Already signed in - go to host dashboard
      router.replace('/host/dashboard')
    } else {
      // Not signed in - redirect to sign-in with host intent
      router.replace('/sign-in?intent=host')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while checking auth and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900 mx-auto mb-4" />
        <p className="text-neutral-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}
