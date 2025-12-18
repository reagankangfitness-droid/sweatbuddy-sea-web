import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Welcome email template
function getWelcomeEmailHtml(name: string | null): string {
  const greeting = name ? `Hey ${name}!` : 'Hey there!'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #E07A5F 0%, #D4654A 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Welcome to SweatBuddies! 🎉
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; background-color: white; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 20px; color: #1B4332; font-size: 18px; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You're now part of Southeast Asia's fitness community. Here's what you can do:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                <li><strong>Browse 50+ free fitness events</strong> happening weekly</li>
                <li><strong>Save events</strong> you're interested in</li>
                <li><strong>RSVP</strong> to let organizers know you're coming</li>
                <li><strong>Connect</strong> with workout buddies in your city</li>
              </ul>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.sweatbuddies.co" style="display: inline-block; padding: 16px 32px; background-color: #E07A5F; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px;">
                      Browse Events
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6B7280; font-size: 14px; text-align: center;">
                Questions? Reply to this email or DM us <a href="https://instagram.com/_sweatbuddies" style="color: #E07A5F;">@_sweatbuddies</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                SweatBuddies - Find Your Crew. Sweat Together.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses[0]?.email_address || ''
    const name = first_name && last_name
      ? `${first_name} ${last_name}`
      : first_name || null

    try {
      // Upsert user into database
      await prisma.user.upsert({
        where: { id },
        create: {
          id,
          email,
          name,
          imageUrl: image_url || null,
        },
        update: {
          email,
          name,
          imageUrl: image_url || null,
        },
      })

      console.log(`User ${id} synced successfully`)

      // Send welcome email only for new users
      if (eventType === 'user.created' && email) {
        try {
          const result = await sendEmail({
            to: email,
            subject: 'Welcome to SweatBuddies! 🏃‍♂️',
            html: getWelcomeEmailHtml(name),
            replyTo: 'hello@sweatbuddies.co',
            tags: [{ name: 'type', value: 'welcome' }],
          })

          if (result.success) {
            console.log(`Welcome email sent to ${email}`)
          } else {
            console.error(`Failed to send welcome email to ${email}:`, result.error)
          }
        } catch (emailError) {
          // Don't fail the webhook if email fails
          console.error('Error sending welcome email:', emailError)
        }
      }
    } catch (error) {
      console.error('Error syncing user to database:', error)
      return NextResponse.json(
        { error: 'Failed to sync user to database' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
}
