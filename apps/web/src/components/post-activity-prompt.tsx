'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CompletionCardCreator } from '@/components/completion-card-creator'
import { Camera, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostActivityPromptProps {
  userActivityId: string
  activityTitle: string
  activityImage?: string | null
  hostName: string
  hostAvatar?: string | null
  completedAt: Date
  durationMinutes?: number | null
  className?: string
  onDismiss?: () => void
  onComplete?: (cardId: string) => void
}

export function PostActivityPrompt({
  userActivityId,
  activityTitle,
  activityImage,
  hostName,
  hostAvatar,
  completedAt,
  durationMinutes,
  className,
  onDismiss,
  onComplete,
}: PostActivityPromptProps) {
  const [showCreator, setShowCreator] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleComplete = (cardId: string) => {
    setIsDismissed(true)
    onComplete?.(cardId)
  }

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground',
          className
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              Great workout! 🎉
            </h3>
            <p className="text-sm opacity-90 mt-0.5">
              Create a shareable card to celebrate completing &quot;{activityTitle}&quot;
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCreator(true)}
            className="flex-shrink-0 bg-white text-primary hover:bg-white/90"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Create Card
          </Button>
        </div>
      </div>

      <CompletionCardCreator
        open={showCreator}
        userActivityId={userActivityId}
        activityTitle={activityTitle}
        activityImage={activityImage}
        hostName={hostName}
        hostAvatar={hostAvatar}
        completedAt={completedAt}
        durationMinutes={durationMinutes}
        onComplete={handleComplete}
        onClose={() => setShowCreator(false)}
      />
    </>
  )
}

// Compact version for list views
export function PostActivityPromptCompact({
  userActivityId,
  activityTitle,
  activityImage,
  hostName,
  hostAvatar,
  completedAt,
  durationMinutes,
  className,
  onComplete,
}: Omit<PostActivityPromptProps, 'onDismiss'>) {
  const [showCreator, setShowCreator] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreator(true)}
        className={cn('gap-1.5', className)}
      >
        <Camera className="w-4 h-4" />
        Share
      </Button>

      <CompletionCardCreator
        open={showCreator}
        userActivityId={userActivityId}
        activityTitle={activityTitle}
        activityImage={activityImage}
        hostName={hostName}
        hostAvatar={hostAvatar}
        completedAt={completedAt}
        durationMinutes={durationMinutes}
        onComplete={onComplete}
        onClose={() => setShowCreator(false)}
      />
    </>
  )
}
