import { cn } from '@/lib/utils'
import { getActivityColor } from '@/lib/utils'
import { getActivityConfig } from '@/lib/activity-types'

interface ActivityBadgeProps {
  type: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export function ActivityBadge({ type, size = 'md', showIcon = true, className }: ActivityBadgeProps) {
  const colors = getActivityColor(type)
  const config = getActivityConfig(type)
  const icon = config?.emoji ?? '🏅'
  const label = config?.label ?? (type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '))

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold uppercase tracking-wide',
        colors.bg,
        colors.text,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && <span className="text-[10px] leading-none">{icon}</span>}
      {label}
    </span>
  )
}
