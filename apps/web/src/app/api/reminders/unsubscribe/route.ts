import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUnsubscribeToken } from '@/lib/event-reminders'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reminders/unsubscribe?aid={attendanceId}&token={token}
 *
 * Token-verified unsubscribe endpoint. Sets subscribe=false on the
 * attendance record and cancels all pending reminders for it.
 * Returns a simple HTML page confirming the action.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const attendanceId = searchParams.get('aid')
  const token = searchParams.get('token')

  if (!attendanceId || !token) {
    return new NextResponse(htmlPage('Invalid Link', 'The unsubscribe link is invalid or incomplete.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Verify token
  if (!verifyUnsubscribeToken(attendanceId, token)) {
    return new NextResponse(htmlPage('Invalid Link', 'The unsubscribe link is invalid or has expired.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    // Check attendance exists
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: attendanceId },
      select: { id: true, eventName: true },
    })

    if (!attendance) {
      return new NextResponse(htmlPage('Not Found', 'The attendance record was not found.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Update subscribe=false
    await prisma.eventAttendance.update({
      where: { id: attendanceId },
      data: { subscribe: false },
    })

    // Cancel all pending reminders for this attendance
    await prisma.eventReminder.updateMany({
      where: {
        attendanceId,
        status: 'PENDING',
      },
      data: {
        status: 'SKIPPED',
        errorMessage: 'User unsubscribed via email link',
      },
    })

    const eventName = attendance.eventName || 'this event'
    return new NextResponse(
      htmlPage(
        'Unsubscribed',
        `You've been unsubscribed from reminders for <strong>${escapeHtml(eventName)}</strong>. You will no longer receive reminder emails for this event.`
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new NextResponse(htmlPage('Error', 'Something went wrong. Please try again later.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SweatBuddies</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e40af; font-size: 24px; margin: 0 0 16px; }
    p { color: #374151; font-size: 16px; line-height: 1.6; margin: 0; }
    a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 24px;"><a href="https://www.sweatbuddies.co">Back to SweatBuddies</a></p>
  </div>
</body>
</html>`
}
