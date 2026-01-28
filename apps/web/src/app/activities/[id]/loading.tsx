import { Header } from '@/components/header'

export default function ActivityLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-32 sm:pt-28 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Title skeleton */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="h-8 sm:h-10 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-9 w-20 bg-muted rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Image skeleton */}
          <div className="mb-6 rounded-lg overflow-hidden border">
            <div className="w-full h-64 sm:h-96 bg-muted animate-pulse" />
          </div>

          {/* Content grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              {/* Description skeleton */}
              <div className="rounded-lg border p-6">
                <div className="h-6 w-28 bg-muted rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
                </div>
              </div>

              {/* Details skeleton */}
              <div className="rounded-lg border p-6">
                <div className="h-6 w-20 bg-muted rounded animate-pulse mb-3" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Organizer skeleton */}
              <div className="rounded-lg border p-6">
                <div className="h-6 w-24 bg-muted rounded animate-pulse mb-3" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-36 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Map skeleton */}
            <div className="rounded-lg border p-6">
              <div className="h-6 w-20 bg-muted rounded animate-pulse mb-3" />
              <div className="w-full h-[300px] bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
