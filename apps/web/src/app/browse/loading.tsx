export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Nav skeleton */}
      <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="h-7 w-32 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-16 bg-neutral-800 rounded-xl animate-pulse" />
          <div className="h-9 w-24 bg-neutral-800 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Hero strip skeleton */}
      <div className="border-b border-neutral-800 px-6 py-10">
        <div className="h-9 w-56 bg-neutral-800 rounded-xl mb-3 animate-pulse" />
        <div className="h-5 w-80 bg-neutral-800/60 rounded-lg animate-pulse" />
      </div>

      {/* Filter pills skeleton */}
      <div className="border-b border-neutral-800 px-6 py-3 flex gap-2">
        {[80, 60, 80, 65, 72, 80, 72].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-neutral-800 animate-pulse flex-shrink-0"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-4 w-32 bg-neutral-800/60 rounded mb-6 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-6 w-20 bg-neutral-800 rounded-full animate-pulse" />
                <div className="h-6 w-12 bg-neutral-800 rounded-full animate-pulse" />
              </div>
              <div className="h-5 w-full bg-neutral-800 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-neutral-800/60 rounded animate-pulse" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-40 bg-neutral-800/60 rounded animate-pulse" />
                <div className="h-4 w-32 bg-neutral-800/60 rounded animate-pulse" />
              </div>
              <div className="border-t border-neutral-800 pt-3 flex items-center gap-2">
                <div className="h-8 w-8 bg-neutral-800 rounded-full animate-pulse" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-neutral-800/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
