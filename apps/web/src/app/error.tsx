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
    <div className="sb-page flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-950 border border-red-800 rounded-full flex items-center justify-center">
          <span className="text-3xl">😅</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Something broke.
        </h2>
        <p className="mb-6 text-white/68">
          Not you &mdash; us. We&apos;re on it.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="sb-button-primary w-full px-6 py-3"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="sb-button-secondary w-full px-6 py-3"
          >
            Go back home
          </button>
        </div>
        {/* Only show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-white/60">
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
