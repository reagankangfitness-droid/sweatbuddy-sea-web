interface StickyBottomBarProps {
  children: React.ReactNode
  show?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

export function StickyBottomBar({ children, show = true, maxWidth = '2xl' }: StickyBottomBarProps) {
  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+4rem)] z-30">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
        {children}
      </div>
    </div>
  )
}
