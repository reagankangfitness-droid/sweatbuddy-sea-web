export default function BuddyLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur border-b border-[#333333] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-5 w-28 bg-[#2A2A2A] rounded animate-pulse mb-1" />
            <div className="h-3 w-40 bg-[#2A2A2A] rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-[#2A2A2A] rounded-xl animate-pulse" />
        </div>
        {/* Tab pills skeleton */}
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <div className="h-8 w-32 bg-[#2A2A2A] rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-[#2A2A2A] rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Session cards skeleton */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Filters row */}
        <div className="py-2 flex gap-2">
          <div className="h-9 w-24 bg-[#2A2A2A] rounded-xl animate-pulse" />
          <div className="h-9 w-24 bg-[#2A2A2A] rounded-xl animate-pulse" />
          <div className="h-9 w-16 bg-[#2A2A2A] rounded-xl animate-pulse" />
          <div className="h-9 w-16 bg-[#2A2A2A] rounded-xl animate-pulse" />
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#333333] bg-[#1A1A1A] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#2A2A2A] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-[#2A2A2A] rounded animate-pulse" />
                  <div className="h-5 w-12 bg-[#2A2A2A] rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-3 w-28 bg-[#2A2A2A] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-[#2A2A2A] rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
