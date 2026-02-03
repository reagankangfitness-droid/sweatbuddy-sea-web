import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// Your email to receive notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@sweatbuddies.co'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Send notification to admin
    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2B3C; margin-bottom: 24px;">New Newsletter Subscriber</h2>

        <div style="background: #F5F0E6; padding: 24px; border-radius: 12px;">
          <p style="color: #1A2B3C; margin: 0; font-size: 18px;">
            <strong>${email}</strong>
          </p>
        </div>

        <p style="color: #737373; font-size: 14px; margin-top: 24px;">
          Subscribed on ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    `

    // Send welcome email to subscriber
    const welcomeEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1A2B3C; margin-bottom: 8px;">Welcome to SweatBuddies</h1>
        <p style="color: #737373; margin-bottom: 32px;">You're now on the list for the Weekly Drop.</p>

        <div style="background: #F5F0E6; padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
          <h2 style="color: #1A2B3C; margin: 0 0 12px 0;">What to Expect</h2>
          <p style="color: #2D2D2D; margin: 0; line-height: 1.6;">
            Every Wednesday, we'll send you the best open-access fitness events happening in Singapore. Run clubs, yoga sessions, bootcamps, and more — curated so you can skip the search and just show up.
          </p>
        </div>

        <p style="color: #737373; margin-bottom: 24px;">
          In the meantime, check out what's happening this week:
        </p>

        <a href="https://www.sweatbuddies.co#events" style="display: inline-block; background: #C65D3B; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          See What's On
        </a>

        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 40px 0 24px 0;">

        <p style="color: #737373; font-size: 12px; text-align: center;">
          Your city's moving. Keep up.<br>
          <a href="https://www.sweatbuddies.co" style="color: #C65D3B;">www.sweatbuddies.co</a>
        </p>
      </div>
    `

    // Send both emails in parallel
    const [adminResult, welcomeResult] = await Promise.all([
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Newsletter Subscriber: ${email}`,
        html: adminEmailHtml,
        tags: [{ name: 'type', value: 'newsletter-signup' }],
      }),
      sendEmail({
        to: email,
        subject: 'Welcome to SweatBuddies',
        html: welcomeEmailHtml,
        tags: [{ name: 'type', value: 'newsletter-welcome' }],
      }),
    ])


    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
