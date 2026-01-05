interface StatCardProps {
  value: number | string
  label: string
}

export function StatCard({ value, label }: StatCardProps) {
  // Check if value is a long string (like "Post your first event!")
  const isLongValue = typeof value === 'string' && value.length > 10

  return (
    <div className="bg-neutral-50 rounded-xl p-4 sm:p-6 text-center">
      <div className={`font-bold text-neutral-900 mb-1 ${
        isLongValue
          ? 'text-sm sm:text-base'
          : 'text-xl sm:text-2xl md:text-3xl'
      }`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm text-neutral-500">
        {label}
      </div>
    </div>
  )
}
