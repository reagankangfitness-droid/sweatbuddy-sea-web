export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="h-8 w-32 bg-neutral-200 rounded-lg animate-pulse" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-neutral-200 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden">
              <div className="aspect-square bg-neutral-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-5 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-neutral-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
