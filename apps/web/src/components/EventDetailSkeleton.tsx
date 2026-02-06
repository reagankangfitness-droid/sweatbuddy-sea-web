'use client'

export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 animate-pulse">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96 bg-neutral-200 dark:bg-neutral-800">
        {/* Back button */}
        <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 dark:bg-black/20 backdrop-blur rounded-full" />
        {/* Share button */}
        <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 dark:bg-black/20 backdrop-blur rounded-full" />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-32 sm:pb-12">
        {/* Event Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-5 sm:p-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="h-6 w-20 bg-violet-100 dark:bg-violet-900/30 rounded-full" />
              <div className="h-6 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            </div>

            {/* Title */}
            <div className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />

            {/* Date & Time */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>

            {/* About Section */}
            <div className="mb-6">
              <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
                <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
                <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>

            {/* Location Section */}
            <div className="mb-6">
              <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded mt-0.5" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                  <div className="h-4 w-64 bg-neutral-100 dark:bg-neutral-800 rounded" />
                </div>
                <div className="h-9 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-6" />

            {/* Organizer Section */}
            <div className="mb-6">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-600 rounded" />
                </div>
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
              </div>
            </div>

            {/* Attendees Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-4 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full border-2 border-white dark:border-neutral-900"
                  />
                ))}
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                  <div className="h-3 w-6 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden sm:block border-t border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="h-12 w-32 bg-neutral-900 dark:bg-white rounded-full" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
            <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="h-11 w-28 bg-neutral-900 dark:bg-white rounded-full" />
        </div>
      </div>
    </div>
  )
}
