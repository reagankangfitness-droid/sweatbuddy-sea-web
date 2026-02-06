'use client'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="h-9 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Welcome Skeleton */}
        <div className="mb-2">
          <div className="h-7 w-72 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-5 w-56 bg-neutral-100 dark:bg-neutral-900 rounded" />
        </div>

        {/* Pulse Card Skeleton */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl border border-violet-200 dark:border-violet-800 p-4 sm:p-5 mb-6 sm:mb-8 mt-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-lg" />
              <div>
                <div className="h-4 w-32 bg-violet-200 dark:bg-violet-800 rounded mb-1" />
                <div className="h-3 w-20 bg-violet-100 dark:bg-violet-900 rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-violet-100 dark:bg-violet-900 rounded w-full" />
            <div className="h-4 bg-violet-100 dark:bg-violet-900 rounded w-4/5" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 sm:p-6 ${i === 3 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Quick Links Skeleton */}
        <div className="flex gap-2 mb-6 sm:mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Events Section Skeleton */}
          <div className="lg:col-span-2">
            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-9 rounded-full ${i === 1 ? 'w-20 bg-neutral-900 dark:bg-white' : 'w-24 bg-neutral-100 dark:bg-neutral-800'}`}
                />
              ))}
            </div>

            {/* Events List Skeleton */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                      <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-900 rounded mb-2" />
                      <div className="h-4 w-56 bg-neutral-100 dark:bg-neutral-900 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Activity Skeleton */}
            <div>
              <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                        <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-900 rounded" />
                      </div>
                      <div className="h-3 w-8 bg-neutral-100 dark:bg-neutral-900 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Regulars Skeleton */}
            <div>
              <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                        <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-900 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
