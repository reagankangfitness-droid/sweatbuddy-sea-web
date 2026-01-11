export default function EventLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Image skeleton */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] bg-neutral-200 animate-pulse" />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Category & date */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
            <div className="h-5 w-32 bg-neutral-100 rounded animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-8 w-3/4 bg-neutral-200 rounded-lg animate-pulse mb-4" />

          {/* Host */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
            <div>
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <div className="h-12 w-full bg-neutral-200 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-neutral-100 rounded-lg animate-pulse" />
              <div className="h-10 flex-1 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
