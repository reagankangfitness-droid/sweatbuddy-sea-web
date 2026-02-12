'use client'

import { useRouter } from 'next/navigation'
import { ReviewForm } from '@/components/review-form'

interface ReviewPageClientProps {
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
}

export function ReviewPageClient({
  bookingId,
  activity,
  existingReview,
}: ReviewPageClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/my-bookings?reviewed=true')
  }

  return (
    <ReviewForm
      bookingId={bookingId}
      activity={activity}
      existingReview={existingReview}
      onSuccess={handleSuccess}
    />
  )
}
