import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-6', className)}>
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-white text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
