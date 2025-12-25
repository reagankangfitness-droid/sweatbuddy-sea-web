// Skeleton loading components for better perceived performance

export function EventCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-card animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] rounded-t-2xl bg-neutral-50/50" />

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Title skeleton */}
        <div className="h-6 bg-neutral-100 rounded-lg mb-2 w-3/4" />
        <div className="h-6 bg-neutral-50 rounded-lg mb-3 w-1/2" />

        {/* Date skeleton */}
        <div className="h-4 bg-neutral-50 rounded-lg mb-1 w-2/3" />

        {/* Location skeleton */}
        <div className="h-4 bg-neutral-50 rounded-lg mb-4 w-1/2" />

        <div className="flex-1" />

        {/* Button skeleton */}
        <div className="h-12 bg-neutral-900/20 rounded-full" />
      </div>
    </div>
  )
}

export function EventListCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card animate-pulse">
      {/* Image skeleton */}
      <div className="flex-shrink-0 w-20 h-20 bg-neutral-50/50 rounded-xl" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-3 bg-neutral-900/20 rounded w-16 mb-2" />
        <div className="h-5 bg-neutral-100 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-50 rounded w-1/2 mb-2" />
        <div className="h-3 bg-neutral-50 rounded w-2/3" />
      </div>
    </div>
  )
}

export function CarouselCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[85vw] snap-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-50/50 shadow-lg animate-pulse">
        {/* Content placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="h-8 bg-white/20 rounded-lg w-3/4 mb-2" />
          <div className="h-6 bg-white/20 rounded-lg w-1/2 mb-4" />
          <div className="h-12 bg-neutral-900/30 rounded-full w-full" />
        </div>
      </div>
    </div>
  )
}

export function MobileHeroSkeleton() {
  return (
    <div className="md:hidden relative min-h-[85vh] flex flex-col justify-end overflow-hidden bg-neutral-800 animate-pulse">
      {/* Content */}
      <div className="relative z-10 px-5 pb-8 pt-32">
        <div className="h-10 bg-white/20 rounded-lg w-2/3 mb-2" />
        <div className="h-10 bg-white/10 rounded-lg w-1/2 mb-6" />
        <div className="h-5 bg-white/10 rounded-lg w-full mb-6" />

        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-20 bg-white/10 rounded-2xl border border-white/20" />
          <div className="flex-1 h-20 bg-white/10 rounded-2xl border border-white/20" />
          <div className="flex-1 h-20 bg-white/10 rounded-2xl border border-white/20" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 h-14 bg-white/30 rounded-full" />
          <div className="flex-1 h-14 bg-white/10 rounded-full border border-white/20" />
        </div>
      </div>
    </div>
  )
}

export function EventsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MobileEventsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="px-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventListCardSkeleton key={i} />
      ))}
    </div>
  )
}
