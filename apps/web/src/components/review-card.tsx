'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ThumbsUp,
  MessageCircle,
  MoreHorizontal,
  CheckCircle,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/star-rating'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title: string | null
    content: string | null
    photos: string[]
    isVerified: boolean
    helpfulCount: number
    createdAt: Date | string
    editedAt: Date | string | null
    reviewer: {
      id: string
      name: string | null
      imageUrl: string | null
    }
    activity?: {
      id: string
      title: string
      imageUrl: string | null
    }
    hostResponse?: {
      id: string
      content: string
      createdAt: Date | string
      editedAt: Date | string | null
    } | null
    userHasVotedHelpful?: boolean
  }
  showActivity?: boolean
  isHost?: boolean
  isOwner?: boolean
  onRespond?: (reviewId: string, response: string) => void
  onEdit?: (reviewId: string) => void
  onDelete?: (reviewId: string) => void
  className?: string
}

export function ReviewCard({
  review,
  showActivity = false,
  isHost = false,
  isOwner = false,
  onRespond,
  onEdit,
  onDelete,
  className,
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseContent, setResponseContent] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [votingHelpful, setVotingHelpful] = useState(false)
  const [hasVoted, setHasVoted] = useState(review.userHasVotedHelpful || false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount)
  const [showOptions, setShowOptions] = useState(false)

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleVoteHelpful = async () => {
    setVotingHelpful(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setHasVoted(data.voted)
        setHelpfulCount(data.newCount)
      } else {
        const data = await res.json()
        if (data.error === 'Unauthorized') {
          toast.error('Please sign in to vote')
        }
      }
    } catch (error) {
      toast.error('Failed to vote')
    } finally {
      setVotingHelpful(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) {
      toast.error('Please write a response')
      return
    }

    setSubmittingResponse(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: responseContent.trim() }),
      })

      if (res.ok) {
        toast.success('Response submitted!')
        onRespond?.(review.id, responseContent.trim())
        setShowResponseForm(false)
        setResponseContent('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit response')
      }
    } catch (error) {
      toast.error('Failed to submit response')
    } finally {
      setSubmittingResponse(false)
    }
  }

  return (
    <div className={cn('bg-white rounded-xl border border-border p-5', className)}>
      {/* Activity info (if showing) */}
      {showActivity && review.activity && (
        <Link
          href={`/activities/${review.activity.id}`}
          className="flex items-center gap-3 mb-4 pb-4 border-b border-border"
        >
          {review.activity.imageUrl && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={review.activity.imageUrl}
                alt={review.activity.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {review.activity.title}
            </p>
            <p className="text-xs text-muted-foreground">View Activity</p>
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {review.reviewer.imageUrl ? (
              <Image
                src={review.reviewer.imageUrl}
                alt={review.reviewer.name || 'Reviewer'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
                {review.reviewer.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {review.reviewer.name || 'Anonymous'}
              </span>
              {review.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <CheckCircle size={10} />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(review.createdAt)}</span>
              {review.editedAt && <span>(edited)</span>}
            </div>
          </div>
        </div>

        {/* Options menu for owner */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <MoreHorizontal size={18} className="text-muted-foreground" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit?.(review.id)
                    setShowOptions(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(review.id)
                    setShowOptions(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
      )}

      {/* Content */}
      {review.content && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {review.content}
        </p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {review.photos.map((photo, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
            >
              <Image src={photo} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Host Response */}
      {review.hostResponse && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-foreground mb-2">
            Host Response
          </p>
          <p className="text-sm text-muted-foreground">
            {review.hostResponse.content}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {formatDate(review.hostResponse.createdAt)}
            {review.hostResponse.editedAt && ' (edited)'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        {/* Helpful vote */}
        <button
          onClick={handleVoteHelpful}
          disabled={votingHelpful}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            hasVoted
              ? 'text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {votingHelpful ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ThumbsUp size={16} className={cn(hasVoted && 'fill-current')} />
          )}
          <span>Helpful ({helpfulCount})</span>
        </button>

        {/* Respond button for host */}
        {isHost && !review.hostResponse && !showResponseForm && (
          <button
            onClick={() => setShowResponseForm(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle size={16} />
            <span>Respond</span>
          </button>
        )}
      </div>

      {/* Response form for host */}
      {showResponseForm && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
          <Textarea
            placeholder="Write your response to this review..."
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {responseContent.length}/2000
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResponseForm(false)
                  setResponseContent('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitResponse}
                disabled={submittingResponse || !responseContent.trim()}
              >
                {submittingResponse ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
