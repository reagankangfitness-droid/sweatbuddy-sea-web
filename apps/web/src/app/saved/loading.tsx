export default function SavedLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header skeleton */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
          <div>
            <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex gap-4 p-4">
              <div className="w-20 h-20 bg-neutral-200 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
                <div className="h-3 w-28 bg-neutral-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
