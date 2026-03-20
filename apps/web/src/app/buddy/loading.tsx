export default function BuddyLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#FFFBF8]">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#FFFBF8]/90 backdrop-blur border-b border-neutral-100 dark:border-black/[0.06] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-40 bg-neutral-100 dark:bg-neutral-200/60 rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-neutral-200 dark:bg-neutral-200 rounded-xl animate-pulse" />
        </div>
        {/* Tab pills skeleton */}
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-200 rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-neutral-100 dark:bg-neutral-200/60 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Session cards skeleton */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Filters row */}
        <div className="py-2 flex gap-2">
          <div className="h-9 w-24 bg-neutral-100 dark:bg-neutral-200/60 rounded-xl animate-pulse" />
          <div className="h-9 w-24 bg-neutral-100 dark:bg-neutral-200/60 rounded-xl animate-pulse" />
          <div className="h-9 w-16 bg-neutral-100 dark:bg-neutral-200/60 rounded-xl animate-pulse" />
          <div className="h-9 w-16 bg-neutral-100 dark:bg-neutral-200/60 rounded-xl animate-pulse" />
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-100 dark:border-black/[0.06] bg-white dark:bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-200/60 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-neutral-100 dark:bg-neutral-200/60 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-200 rounded animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-3 w-28 bg-neutral-100 dark:bg-neutral-200/60 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-200/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
