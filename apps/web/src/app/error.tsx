'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    // Log error to console in development
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-950 border border-red-800 rounded-full flex items-center justify-center">
          <span className="text-3xl">😅</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Something broke.
        </h2>
        <p className="text-[#666666] mb-6">
          Not you &mdash; us. We&apos;re on it.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-[#1A1A1A] text-white rounded-full font-semibold hover:bg-black transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-[#1A1A1A] text-white border border-white/10 rounded-full font-medium hover:bg-[#2A2A2A] transition-colors"
          >
            Go back home
          </button>
        </div>
        {/* Only show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-[#666666] cursor-pointer">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-red-500 overflow-auto max-h-40">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
