'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    imageUrl: string | null
    slug: string | null
  }
}

interface SessionCommentsProps {
  activityId: string
  currentUserId: string | null
  hostUserId: string
}

export function SessionComments({ activityId, currentUserId, hostUserId }: SessionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [activityId])

  async function fetchComments() {
    try {
      const res = await fetch(`/api/buddy/sessions/${activityId}/comment`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    if (!currentUserId) {
      toast.error('Sign in to comment')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/buddy/sessions/${activityId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to post comment')
        return
      }

      const data = await res.json()
      setComments((prev) => [...prev, data.comment])
      setContent('')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/buddy/sessions/${activityId}/comment/${commentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete comment')
        return
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4" />
        Comments ({comments.length})
      </h2>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="space-y-4 mb-5">
          {comments.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">No comments yet. Be the first!</p>
          ) : (
            comments.map((comment) => {
              const canDelete = currentUserId === comment.user.id || currentUserId === hostUserId
              return (
                <div key={comment.id} className="flex gap-3">
                  {comment.user.imageUrl ? (
                    <Image
                      src={comment.user.imageUrl}
                      alt={comment.user.name ?? ''}
                      width={32}
                      height={32}
                      className="rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-500 flex-shrink-0 mt-0.5">
                      {(comment.user.name ?? '?')[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {comment.user.name ?? 'Anonymous'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="p-1 text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      {deletingId === comment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Comment input */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask a question or leave a note..."
            maxLength={500}
            className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-xl bg-black dark:bg-white px-3 py-2.5 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  )
}
