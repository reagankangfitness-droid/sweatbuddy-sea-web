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
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-900 rounded-full flex items-center justify-center">
          <span className="text-3xl">😅</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 mb-2">
          Something broke.
        </h2>
        <p className="text-neutral-500 mb-6">
          Not you &mdash; us. We&apos;re on it.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-white text-neutral-900 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-neutral-800 text-neutral-300 rounded-full font-medium hover:bg-neutral-700 transition-colors"
          >
            Go back home
          </button>
        </div>
        {/* Only show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-neutral-400 cursor-pointer">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-neutral-800 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
