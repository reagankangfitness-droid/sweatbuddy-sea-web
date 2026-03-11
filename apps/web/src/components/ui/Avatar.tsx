import { cn } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const GRADIENT_CLASSES = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-pink-500 to-pink-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
]

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const IMAGE_SIZES = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 }

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size]
  const px = IMAGE_SIZES[size]

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeClass, className)}>
        <Image src={src} alt={alt ?? 'Avatar'} width={px} height={px} className="object-cover w-full h-full" />
      </div>
    )
  }

  const initials = (fallback ?? '?').substring(0, 2).toUpperCase()
  const gradient = GRADIENT_CLASSES[(initials.charCodeAt(0) ?? 0) % GRADIENT_CLASSES.length]

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold text-white flex-shrink-0',
        `bg-gradient-to-br ${gradient}`,
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  )
}
