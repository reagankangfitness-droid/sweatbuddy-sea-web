'use client'

import { getCategoryEmoji } from '@/lib/categories'

interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
}

export function ActivityBreakdown({ categories }: { categories: CategoryBreakdown[] }) {
  if (categories.length === 0) return null

  const maxCount = categories[0]?.count || 1

  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1 mb-3">
        Activity Breakdown
      </h3>
      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 space-y-3">
        {categories.map(cat => (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-300">
                {getCategoryEmoji(cat.category)} {cat.category}
              </span>
              <span className="text-xs text-neutral-500">
                {cat.count} ({cat.percentage}%)
              </span>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/70 rounded-full transition-all duration-500"
                style={{ width: `${(cat.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
