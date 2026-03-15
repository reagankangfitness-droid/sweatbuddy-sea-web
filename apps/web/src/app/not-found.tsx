import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-neutral-800 rounded-full flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">
          Page not found
        </h1>
        <p className="text-neutral-500 mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-white text-neutral-900 rounded-full font-semibold hover:bg-neutral-200 transition-colors text-center"
          >
            Go back home
          </Link>
          <Link
            href="/browse"
            className="block w-full px-6 py-3 bg-neutral-800 text-neutral-300 rounded-full font-medium hover:bg-neutral-700 transition-colors text-center"
          >
            Browse sessions
          </Link>
        </div>
      </div>
    </div>
  )
}
