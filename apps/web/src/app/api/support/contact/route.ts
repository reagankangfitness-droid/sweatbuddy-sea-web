import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, category, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const categoryLabels: Record<string, string> = {
      general: 'General Question',
      booking: 'Booking Issue',
      payment: 'Payment Problem',
      refund: 'Refund Request',
      hosting: 'Hosting Question',
      bug: 'Bug Report',
      feedback: 'Feedback / Suggestion',
    }

    const categoryLabel = categoryLabels[category] || 'General'

    // Send email to support team
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@sweatbuddies.sg'

    await sendEmail({
      to: supportEmail,
      subject: `[SweatBuddies Support] ${categoryLabel} from ${name}`,
      replyTo: email,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Support Request</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #6b7280;">From:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  ${name} &lt;${email}&gt;
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #6b7280;">Category:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                    ${categoryLabel}
                  </span>
                </td>
              </tr>
            </table>

            <div style="margin-top: 20px;">
              <strong style="color: #6b7280;">Message:</strong>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap;">
${message}
              </div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Support Request

From: ${name} <${email}>
Category: ${categoryLabel}

Message:
${message}

---
Reply directly to this email to respond to ${name}.
      `.trim(),
    })

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'We received your message - SweatBuddies Support',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✉️</div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Message Received!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi ${name},</p>

            <p>Thanks for reaching out to SweatBuddies! We've received your message and will get back to you within <strong>24 hours</strong>.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0;"><strong>Your message:</strong></p>
              <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${message}</p>
            </div>

            <p>In the meantime, you might find answers in our <a href="https://sweatbuddies.sg/support" style="color: #10b981; text-decoration: none;">FAQ section</a>.</p>

            <p style="margin-bottom: 0;">
              Best,<br>
              <strong>The SweatBuddies Team</strong>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">SweatBuddies - Find your fitness crew</p>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Thanks for reaching out to SweatBuddies! We've received your message and will get back to you within 24 hours.

Your message:
${message}

In the meantime, you might find answers in our FAQ section at https://sweatbuddies.sg/support

Best,
The SweatBuddies Team
      `.trim(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Support contact error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
