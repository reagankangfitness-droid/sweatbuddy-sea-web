'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function OrganizerVerifyPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/organizer/verify?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        setStatus('success')

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/organizer/dashboard')
        }, 1500)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    if (token) {
      verifyToken()
    }
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#1800ad] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your link...
            </h1>
            <p className="text-gray-600">
              Please wait while we log you in
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600 mb-4">
              Redirecting to your dashboard...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Link
              href="/organizer"
              className="inline-block px-6 py-3 bg-[#1800ad] text-white font-semibold rounded-xl hover:bg-[#1800ad]/90 transition"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
