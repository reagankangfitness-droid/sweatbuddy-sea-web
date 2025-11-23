import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { activityId } = await request.json()

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }

    // Fetch activity details
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        user: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has already joined
    const existingUserActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    })

    if (existingUserActivity && existingUserActivity.status === 'JOINED') {
      return NextResponse.json({ error: 'You have already joined this activity' }, { status: 400 })
    }

    // Check if activity is full
    if (activity.maxPeople) {
      const joinedCount = await prisma.userActivity.count({
        where: {
          activityId,
          status: 'JOINED',
        },
      })

      if (joinedCount >= activity.maxPeople) {
        return NextResponse.json({ error: 'Activity is full' }, { status: 400 })
      }
    }

    // Create or update user activity record with PENDING status
    const userActivity = await prisma.userActivity.upsert({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
      create: {
        userId,
        activityId,
        status: 'INTERESTED',
        paymentStatus: 'PENDING',
      },
      update: {
        status: 'INTERESTED',
        paymentStatus: 'PENDING',
      },
    })

    // Determine the success and cancel URLs
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/activities/${activityId}?payment=success`
    const cancelUrl = `${baseUrl}/activities/${activityId}?payment=cancelled`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: activity.currency.toLowerCase(),
            product_data: {
              name: activity.title,
              description: activity.description || `Join ${activity.title}`,
              images: activity.imageUrl ? [activity.imageUrl] : [],
            },
            unit_amount: Math.round(activity.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        activityId: activity.id,
        userId,
        userActivityId: userActivity.id,
        hostId: activity.hostId || activity.userId,
      },
      customer_email: (await prisma.user.findUnique({ where: { id: userId } }))?.email,
    })

    // Update userActivity with Stripe session ID
    await prisma.userActivity.update({
      where: { id: userActivity.id },
      data: {
        stripeSessionId: session.id,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
