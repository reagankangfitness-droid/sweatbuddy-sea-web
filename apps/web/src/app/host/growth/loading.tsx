import { DashboardHeader } from '@/components/host/DashboardHeader'

export default function GrowthLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-72 mb-8" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            ))}
          </div>

          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-6" />

          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
