'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { InteractiveStarRating } from '@/components/star-rating'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  bookingId: string
  activity: {
    id: string
    title: string
    imageUrl: string | null
    host: {
      name: string | null
      imageUrl: string | null
    }
  }
  existingReview?: {
    id: string
    rating: number
    title: string | null
    content: string | null
    photos: string[]
  } | null
  onSuccess?: () => void
  className?: string
}

export function ReviewForm({
  bookingId,
  activity,
  existingReview,
  onSuccess,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [content, setContent] = useState(existingReview?.content || '')
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos || [])
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const isEditing = !!existingReview

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    setUploadingPhoto(true)

    try {
      // For now, we'll use a placeholder - integrate with your upload service
      // This should upload to UploadThing or similar
      for (const file of Array.from(files)) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast.error('Only images are allowed')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Images must be under 5MB')
          continue
        }

        // Create a temporary URL for preview (in production, upload to cloud)
        const url = URL.createObjectURL(file)
        setPhotos((prev) => [...prev, url])
      }
    } catch (error) {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setLoading(true)

    try {
      const url = isEditing
        ? `/api/reviews/${existingReview.id}`
        : '/api/reviews'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userActivityId: bookingId,
          rating,
          title: title.trim() || null,
          content: content.trim() || null,
          photos,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast.success(isEditing ? 'Review updated!' : 'Review submitted!')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Activity Preview */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
        {activity.imageUrl && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {activity.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Hosted by {activity.host.name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">How was your experience?</Label>
        <div className="flex justify-center py-4">
          <InteractiveStarRating
            value={rating}
            onChange={setRating}
            size="xl"
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Your review (optional)</Label>
        <Textarea
          id="content"
          placeholder="Tell others about your experience. What did you enjoy? Any tips for future attendees?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {content.length}/2000
        </p>
      </div>

      {/* Photos */}
      <div className="space-y-3">
        <Label>Photos (optional)</Label>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden group"
            >
              <Image src={photo} alt={`Upload preview ${index + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {photos.length < 5 && (
            <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="w-5 h-5 text-muted-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Add up to 5 photos (max 5MB each)
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isEditing ? 'Updating...' : 'Submitting...'}
          </>
        ) : isEditing ? (
          'Update Review'
        ) : (
          'Submit Review'
        )}
      </Button>

      {isEditing && (
        <p className="text-xs text-muted-foreground text-center">
          You can edit your review within 48 hours of posting
        </p>
      )}
    </form>
  )
}
