import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ReviewPageClient } from './review-page-client'
import { canReviewBooking } from '@/lib/reviews'

interface ReviewPageProps {
  params: Promise<{ bookingId: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { bookingId } = await params

  // Check if user can review this booking
  const eligibility = await canReviewBooking(bookingId, userId)

  // Get booking details for the form
  const booking = await prisma.userActivity.findUnique({
    where: { id: bookingId },
    include: {
      activity: {
        include: {
          host: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
      review: true,
    },
  })

  if (!booking) {
    notFound()
  }

  // Verify this booking belongs to the user
  if (booking.userId !== userId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link
            href="/bookings"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Bookings</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {eligibility.canReview ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {eligibility.existingReview ? 'Edit Your Review' : 'Write a Review'}
              </h1>
              <p className="text-muted-foreground">
                Share your experience with others
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <ReviewPageClient
                bookingId={bookingId}
                activity={{
                  id: booking.activity.id,
                  title: booking.activity.title,
                  imageUrl: booking.activity.imageUrl,
                  host: {
                    name: booking.activity.host?.name || null,
                    imageUrl: booking.activity.host?.imageUrl || null,
                  },
                }}
                existingReview={
                  eligibility.existingReview
                    ? {
                        id: eligibility.existingReview.id,
                        rating: eligibility.existingReview.rating,
                        title: eligibility.existingReview.title,
                        content: eligibility.existingReview.content,
                        photos: eligibility.existingReview.photos,
                      }
                    : null
                }
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Cannot Write Review
            </h1>
            <p className="text-muted-foreground mb-6">{eligibility.reason}</p>
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Bookings
            </Link>
          </div>
        )}

        {/* Review already submitted success state */}
        {eligibility.existingReview && !eligibility.canEdit && (
          <div className="mt-6 bg-emerald-50 rounded-xl border border-emerald-200 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-900">
                  Review Submitted
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Thank you for your review! The edit window has closed (48 hours
                  after submission).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
