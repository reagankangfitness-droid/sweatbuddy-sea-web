// Skeleton loading components for better perceived performance

export function EventCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
      {/* Image placeholder with shimmer */}
      <div className="aspect-[4/3] rounded-t-2xl skeleton-shimmer" />

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Title skeleton */}
        <div className="h-6 skeleton-shimmer rounded-lg mb-2 w-3/4" />
        <div className="h-6 skeleton-shimmer rounded-lg mb-3 w-1/2" style={{ animationDelay: '0.1s' }} />

        {/* Date skeleton */}
        <div className="h-4 skeleton-shimmer rounded-lg mb-1 w-2/3" style={{ animationDelay: '0.2s' }} />

        {/* Location skeleton */}
        <div className="h-4 skeleton-shimmer rounded-lg mb-4 w-1/2" style={{ animationDelay: '0.3s' }} />

        <div className="flex-1" />

        {/* Button skeleton */}
        <div className="h-12 skeleton-shimmer rounded-full" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

export function EventListCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
      {/* Image skeleton */}
      <div className="flex-shrink-0 w-20 h-20 skeleton-shimmer rounded-xl" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-3 skeleton-shimmer rounded w-16 mb-2" />
        <div className="h-5 skeleton-shimmer rounded w-3/4 mb-2" style={{ animationDelay: '0.1s' }} />
        <div className="h-4 skeleton-shimmer rounded w-1/2 mb-2" style={{ animationDelay: '0.2s' }} />
        <div className="h-3 skeleton-shimmer rounded w-2/3" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}

export function CarouselCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[85vw] snap-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100 shadow-lg">
        {/* Shimmer background */}
        <div className="absolute inset-0 skeleton-shimmer" />
        {/* Content placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="h-8 skeleton-shimmer-dark rounded-lg w-3/4 mb-2" />
          <div className="h-6 skeleton-shimmer-dark rounded-lg w-1/2 mb-4" style={{ animationDelay: '0.1s' }} />
          <div className="h-12 skeleton-shimmer-dark rounded-full w-full" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}

export function MobileHeroSkeleton() {
  return (
    <div className="md:hidden relative min-h-[85vh] flex flex-col justify-end overflow-hidden bg-neutral-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient-dark opacity-30" />

      {/* Floating orbs for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1 absolute -top-10 -right-10 scale-50 opacity-30" />
        <div className="floating-orb floating-orb-2 absolute bottom-1/3 -left-10 scale-50 opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pb-8 pt-32">
        <div className="h-10 skeleton-shimmer-dark rounded-lg w-2/3 mb-2" />
        <div className="h-10 skeleton-shimmer-dark rounded-lg w-1/2 mb-6" style={{ animationDelay: '0.1s' }} />
        <div className="h-5 skeleton-shimmer-dark rounded-lg w-full mb-6" style={{ animationDelay: '0.2s' }} />

        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-20 skeleton-shimmer-dark rounded-2xl" style={{ animationDelay: '0.3s' }} />
          <div className="flex-1 h-20 skeleton-shimmer-dark rounded-2xl" style={{ animationDelay: '0.4s' }} />
          <div className="flex-1 h-20 skeleton-shimmer-dark rounded-2xl" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 h-14 skeleton-shimmer-dark rounded-full" style={{ animationDelay: '0.6s' }} />
          <div className="flex-1 h-14 skeleton-shimmer-dark rounded-full" style={{ animationDelay: '0.7s' }} />
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
