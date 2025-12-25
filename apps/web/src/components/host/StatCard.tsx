interface StatCardProps {
  value: number | string
  label: string
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-neutral-50 rounded-xl p-6 text-center">
      <div className="text-3xl font-bold text-neutral-900 mb-1">
        {value}
      </div>
      <div className="text-sm text-neutral-500">
        {label}
      </div>
    </div>
  )
}
