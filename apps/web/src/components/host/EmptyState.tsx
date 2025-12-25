import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="border border-neutral-200 rounded-xl p-12 text-center">
      <div className="text-neutral-300 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-neutral-500 mb-6">No upcoming events</p>
      <Link
        href="/#submit-desktop"
        className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-700 transition-colors"
      >
        Create your first event
      </Link>
    </div>
  )
}
