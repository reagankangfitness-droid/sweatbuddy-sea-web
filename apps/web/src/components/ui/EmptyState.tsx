import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  imageSrc?: string
  imageAlt?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, imageSrc, imageAlt, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-6', className)}>
      {imageSrc ? (
        <div className="mb-5 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={imageAlt ?? title} className="h-full w-full object-cover opacity-90" />
        </div>
      ) : (
        <div className="text-5xl mb-4 opacity-40">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#666666] max-w-xs leading-relaxed mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A2A] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
