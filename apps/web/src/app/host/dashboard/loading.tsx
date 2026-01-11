export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="h-8 w-40 bg-neutral-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-neutral-200 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome skeleton */}
        <div className="mb-8">
          <div className="h-7 w-64 bg-neutral-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-48 bg-neutral-100 rounded animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-50 rounded-xl p-4">
              <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-neutral-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Events list skeleton */}
        <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="w-16 h-16 bg-neutral-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
