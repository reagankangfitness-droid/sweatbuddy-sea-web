import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema for creating a review
const createReviewSchema = z.object({
  attendanceId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
})

// GET /api/events/[eventId]/reviews - Get all reviews for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // Get event details
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get all published reviews for this event
    const reviews = await prisma.eventReview.findMany({
      where: {
        eventId,
        isPublished: true,
        isFlagged: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        photos: true,
        reviewerName: true,
        helpfulCount: true,
        hostResponse: true,
        hostRespondedAt: true,
        createdAt: true,
      },
    })

    // Calculate rating summary
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }

    return NextResponse.json({
      reviews,
      summary: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    })
  } catch (error: unknown) {
    // Handle case where table doesn't exist yet (migration pending)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
      return NextResponse.json({
        reviews: [],
        summary: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      })
    }
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/reviews - Submit a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()

    // Validate input
    const validation = createReviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { attendanceId, rating, title, content, photos } = validation.data

    // Verify attendance exists and belongs to this event
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: attendanceId },
      select: {
        id: true,
        eventId: true,
        email: true,
        name: true,
        actuallyAttended: true,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    if (attendance.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Attendance does not match this event' },
        { status: 400 }
      )
    }

    // Check if already reviewed
    const existingReview = await prisma.eventReview.findUnique({
      where: { attendanceId },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this event' },
        { status: 400 }
      )
    }

    // Get event details for the review
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Create the review
    const review = await prisma.eventReview.create({
      data: {
        eventId,
        attendanceId,
        reviewerEmail: attendance.email,
        reviewerName: attendance.name,
        hostInstagram: event.organizerInstagram,
        rating,
        title: title || null,
        content: content || null,
        photos: photos || [],
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
