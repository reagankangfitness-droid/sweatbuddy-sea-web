'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Component, ReactNode } from 'react'

// Error boundary for host page
class HostErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Host page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Unable to load form
            </h2>
            <p className="text-neutral-500 mb-4">
              There was an error loading the event creation form.
            </p>
            <details className="text-left bg-neutral-100 p-3 rounded-lg mb-4">
              <summary className="cursor-pointer text-sm text-neutral-600">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto">
                {this.state.error?.message}
                {this.state.error?.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-neutral-900 text-white rounded-full font-semibold"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Dynamically import the form to prevent SSR/hydration issues with Google Maps
const HostForm = dynamic(
  () => import('@/components/host/HostForm').catch((err) => {
    console.error('Failed to load HostForm:', err)
    // Return a simple error component if dynamic import fails
    return {
      default: () => (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Failed to load form component</p>
            <p className="text-sm text-neutral-500 mt-2">{err?.message}</p>
          </div>
        </div>
      ),
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    ),
  }
)

export default function HostApplicationPage() {
  return (
    <HostErrorBoundary>
      <HostForm />
    </HostErrorBoundary>
  )
}
