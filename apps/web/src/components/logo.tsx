'use client'

import { cn } from '@/lib/utils'

/**
 * SweatBuddies Logo Component
 * A smiley face icon representing community and positivity
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
  const fillColor = variant === 'white' ? '#FFFFFF'
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
        {/* Outer ring */}
        <path
          d="M50 8C26.804 8 8 26.804 8 50C8 73.196 26.804 92 50 92C73.196 92 92 73.196 92 50C92 26.804 73.196 8 50 8ZM2 50C2 23.49 23.49 2 50 2C76.51 2 98 23.49 98 50C98 76.51 76.51 98 50 98C23.49 98 2 76.51 2 50Z"
          fill={fillColor}
          fillRule="evenodd"
        />

        {/* Left eye */}
        <circle cx="36" cy="42" r="6" fill={fillColor} />

        {/* Right eye */}
        <circle cx="64" cy="42" r="6" fill={fillColor} />

        {/* Smile */}
        <path
          d="M28 58C30.5 58 34 58.5 36 62C40 69.5 44 74 50 74C56 74 60 69.5 64 62C66 58.5 69.5 58 72 58C76 58 78.5 61 76.5 66C72.5 76 62 84 50 84C38 84 27.5 76 23.5 66C21.5 61 24 58 28 58Z"
          fill={fillColor}
          fillRule="evenodd"
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
        width={size * 0.6}
        height={size * 0.6}
      >
        {/* Outer ring */}
        <path
          d="M50 8C26.804 8 8 26.804 8 50C8 73.196 26.804 92 50 92C73.196 92 92 73.196 92 50C92 26.804 73.196 8 50 8ZM2 50C2 23.49 23.49 2 50 2C76.51 2 98 23.49 98 50C98 76.51 76.51 98 50 98C23.49 98 2 76.51 2 50Z"
          fill={iconColor}
          fillRule="evenodd"
        />
        <circle cx="36" cy="42" r="6" fill={iconColor} />
        <circle cx="64" cy="42" r="6" fill={iconColor} />
        <path
          d="M28 58C30.5 58 34 58.5 36 62C40 69.5 44 74 50 74C56 74 60 69.5 64 62C66 58.5 69.5 58 72 58C76 58 78.5 61 76.5 66C72.5 76 62 84 50 84C38 84 27.5 76 23.5 66C21.5 61 24 58 28 58Z"
          fill={iconColor}
          fillRule="evenodd"
        />
      </svg>
    </div>
  )
}

export default Logo
