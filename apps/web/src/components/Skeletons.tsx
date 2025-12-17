// Skeleton loading components for better perceived performance

export function EventCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-cream rounded-2xl border border-forest-100 shadow-card animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] rounded-t-2xl bg-sand/50" />

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Title skeleton */}
        <div className="h-6 bg-forest-100 rounded-lg mb-2 w-3/4" />
        <div className="h-6 bg-forest-50 rounded-lg mb-3 w-1/2" />

        {/* Date skeleton */}
        <div className="h-4 bg-forest-50 rounded-lg mb-1 w-2/3" />

        {/* Location skeleton */}
        <div className="h-4 bg-forest-50 rounded-lg mb-4 w-1/2" />

        <div className="flex-1" />

        {/* Button skeleton */}
        <div className="h-12 bg-coral/20 rounded-full" />
      </div>
    </div>
  )
}

export function EventListCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-cream rounded-2xl border border-forest-100 shadow-card animate-pulse">
      {/* Image skeleton */}
      <div className="flex-shrink-0 w-20 h-20 bg-sand/50 rounded-xl" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-3 bg-coral/20 rounded w-16 mb-2" />
        <div className="h-5 bg-forest-100 rounded w-3/4 mb-2" />
        <div className="h-4 bg-forest-50 rounded w-1/2 mb-2" />
        <div className="h-3 bg-forest-50 rounded w-2/3" />
      </div>
    </div>
  )
}

export function CarouselCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[85vw] snap-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand/50 shadow-lg animate-pulse">
        {/* Content placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="h-8 bg-white/20 rounded-lg w-3/4 mb-2" />
          <div className="h-6 bg-white/20 rounded-lg w-1/2 mb-4" />
          <div className="h-12 bg-coral/30 rounded-full w-full" />
        </div>
      </div>
    </div>
  )
}

export function MobileHeroSkeleton() {
  return (
    <div className="md:hidden pt-20 px-4 pb-8 bg-sand animate-pulse">
      <div className="h-10 bg-forest-100 rounded-lg w-2/3 mb-2" />
      <div className="h-10 bg-coral/20 rounded-lg w-1/2 mb-6" />
      <div className="h-5 bg-forest-50 rounded-lg w-full mb-6" />

      <div className="flex gap-3 mb-6">
        <div className="flex-1 h-20 bg-cream rounded-2xl border border-forest-100" />
        <div className="flex-1 h-20 bg-cream rounded-2xl border border-forest-100" />
        <div className="flex-1 h-20 bg-cream rounded-2xl border border-forest-100" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 h-14 bg-coral/20 rounded-full" />
        <div className="flex-1 h-14 bg-cream rounded-full border border-forest-100" />
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
