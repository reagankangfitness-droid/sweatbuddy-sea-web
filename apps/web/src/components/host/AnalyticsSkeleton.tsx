'use client'

export function AnalyticsSkeleton() {
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
        <div className="mb-8">
          <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-5 w-64 bg-neutral-100 dark:bg-neutral-900 rounded" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
              <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-8 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
              <div className="h-3 w-10 bg-green-100 dark:bg-green-900/30 rounded" />
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance Chart */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
            <div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-end justify-around px-4 pb-4">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-4 sm:w-6 bg-neutral-200 dark:bg-neutral-700 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Show-up Rate Chart */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="h-5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
            <div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-lg relative overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,180 Q50,160 100,140 T200,120 T300,100 T400,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-neutral-300 dark:text-neutral-600"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Day Distribution & Retention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Day Distribution */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="h-5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex items-center gap-3">
                  <div className="w-8 h-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-200 dark:bg-neutral-700 rounded-full"
                      style={{ width: `${[30, 20, 25, 40, 60, 90, 70][i]}%` }}
                    />
                  </div>
                  <div className="w-8 h-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Retention */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
            <div className="h-48 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-8 border-neutral-200 dark:border-neutral-700 relative">
                <div className="absolute inset-4 rounded-full border-8 border-neutral-100 dark:border-neutral-800" />
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
                <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Events Table */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="h-5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-800 rounded-lg">
                <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-600 rounded" />
                </div>
                <div className="h-6 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
