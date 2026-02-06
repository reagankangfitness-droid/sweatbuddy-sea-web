'use client'

export function CommunitySkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 animate-pulse">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Title */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-5 w-72 bg-neutral-100 dark:bg-neutral-900 rounded" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
              <div className="h-8 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            <div className="h-10 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          </div>
        </div>

        {/* Community List */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-5 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" />
                  </div>
                  <div className="h-4 w-48 bg-neutral-100 dark:bg-neutral-900 rounded" />
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-900 rounded" />
                  <div className="h-4 w-16 bg-neutral-100 dark:bg-neutral-900 rounded" />
                </div>
                <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
