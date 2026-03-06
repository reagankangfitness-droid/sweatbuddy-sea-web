import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="border border-neutral-800 rounded-xl p-12 text-center">
      <span className="text-5xl mb-4 block">📅</span>
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        No upcoming events
      </h3>
      <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
        Time to create something! Your community&apos;s waiting.
      </p>
      <Link
        href="/host"
        className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 font-medium rounded-full hover:bg-neutral-200 transition-colors"
      >
        Create Event
      </Link>
    </div>
  )
}
