'use client'

import { cn } from '@/lib/utils'

/**
 * SweatBuddies Logo Component
 * A minimalist smiley face icon representing community and positivity
 *
 * @param size - Size in pixels (default 40)
 * @param color - Logo color (default #0025CC)
 * @param variant - 'default' | 'white' | 'mono'
 */
interface LogoProps {
  size?: number
  color?: string
  variant?: 'default' | 'white' | 'mono'
  className?: string
  onClick?: () => void
}

export function Logo({
  size = 40,
  color = '#0025CC',
  variant = 'default',
  className,
  onClick,
}: LogoProps) {
  // Determine color based on variant
  const strokeColor = variant === 'white' ? '#FFFFFF'
    : variant === 'mono' ? 'currentColor'
    : color

  return (
    <span
      className={cn('inline-flex items-center justify-center flex-shrink-0', className)}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Left eye - vertical line */}
        <line
          x1="36"
          y1="18"
          x2="36"
          y2="36"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Right eye - vertical line */}
        <line
          x1="64"
          y1="18"
          x2="64"
          y2="36"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Smile - curved arc */}
        <path
          d="M18 52 Q50 92 82 52"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}

/**
 * Logo with wordmark
 */
interface LogoWithTextProps {
  size?: number
  color?: string
  textColor?: string
  variant?: 'default' | 'white'
  className?: string
}

export function LogoWithText({
  size = 32,
  color = '#0025CC',
  textColor = '#0025CC',
  variant = 'default',
  className,
}: LogoWithTextProps) {
  const logoColor = variant === 'white' ? '#FFFFFF' : color
  const wordmarkColor = variant === 'white' ? '#FFFFFF' : textColor

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo size={size} color={logoColor} variant={variant} />
      <span
        className="font-bold tracking-tight"
        style={{
          color: wordmarkColor,
          fontSize: `${size * 0.7}px`,
        }}
      >
        sweatbuddies
      </span>
    </div>
  )
}

/**
 * Favicon/App icon version (filled circle background)
 */
interface LogoIconProps {
  size?: number
  bgColor?: string
  iconColor?: string
  className?: string
}

export function LogoIcon({
  size = 40,
  bgColor = '#0025CC',
  iconColor = '#FFFFFF',
  className,
}: LogoIconProps) {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: bgColor,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size * 0.65}
        height={size * 0.65}
      >
        {/* Left eye - vertical line */}
        <line
          x1="36"
          y1="18"
          x2="36"
          y2="36"
          stroke={iconColor}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Right eye - vertical line */}
        <line
          x1="64"
          y1="18"
          x2="64"
          y2="36"
          stroke={iconColor}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Smile - curved arc */}
        <path
          d="M18 52 Q50 92 82 52"
          stroke={iconColor}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

export default Logo
