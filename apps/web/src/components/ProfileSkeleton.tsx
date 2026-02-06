'use client'

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 animate-pulse">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 mb-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="flex-1">
              <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-4 w-48 bg-neutral-100 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-5 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-neutral-100 dark:border-neutral-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 w-8 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto mb-1" />
                <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded mx-auto" />
              </div>
            ))}
          </div>

          {/* Bio */}
          <div className="pt-4">
            <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
            >
              <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-40 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Sign Out Button */}
        <div className="mt-6">
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
        </div>
      </main>
    </div>
  )
}
