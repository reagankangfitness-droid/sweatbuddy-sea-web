import Link from 'next/link'

export default function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🏃</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Event not found
        </h1>
        <p className="text-neutral-500 mb-8">
          This event may have ended, been cancelled, or the link might be incorrect.
        </p>
        <div className="space-y-3">
          <Link
            href="/events"
            className="block w-full px-6 py-3 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors text-center"
          >
            Browse upcoming events
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-neutral-100 text-neutral-700 rounded-full font-medium hover:bg-neutral-200 transition-colors text-center"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  )
}
