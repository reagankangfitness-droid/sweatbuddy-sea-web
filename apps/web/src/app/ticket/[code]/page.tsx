import { prisma } from '@/lib/prisma'
import { generateCheckInQRCode } from '@/lib/generate-checkin-qr'
import { generateMapsLink } from '@/lib/email'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface TicketPageProps {
  params: Promise<{ code: string }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { code } = await params

  // Find attendance by check-in code
  const attendance = await prisma.eventAttendance.findFirst({
    where: { checkInCode: code },
  })

  if (!attendance) {
    notFound()
  }

  // Find the event
  const event = await prisma.eventSubmission.findUnique({
    where: { id: attendance.eventId },
    select: {
      id: true,
      eventName: true,
      day: true,
      eventDate: true,
      time: true,
      location: true,
      latitude: true,
      longitude: true,
      imageUrl: true,
      organizerName: true,
      organizerInstagram: true,
      status: true,
      refundPolicy: true,
      slug: true,
    },
  })

  if (!event) {
    notFound()
  }

  // Generate QR code
  const qrCodeDataUrl = await generateCheckInQRCode(code)

  // Generate maps link
  const mapsLink = generateMapsLink({
    address: event.location,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
  })

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Google Calendar link
  const calendarUrl = event.eventDate
    ? `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventName)}&dates=${formatCalendarDate(event.eventDate)}/${formatCalendarDate(new Date(event.eventDate.getTime() + 2 * 60 * 60 * 1000))}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(`Hosted by ${event.organizerName}`)}`
    : null

  const isCancelled = event.status === 'CANCELLED'
  const isPast = event.eventDate ? new Date(event.eventDate) < new Date() : false

  const refundPolicyText: Record<string, string> = {
    FULL_ANYTIME: 'Full refund available anytime before the event',
    FULL_24H: 'Full refund available up to 24 hours before the event',
    NONE: 'No refunds available',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
            <h1 className="text-xl font-bold mb-1">{event.eventName}</h1>
            <p className="text-amber-100 text-sm">Hosted by {event.organizerName}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-6 px-4">
            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center w-full">
                <p className="text-red-700 font-semibold text-lg">Event Cancelled</p>
                <p className="text-red-500 text-sm mt-1">This event has been cancelled by the host.</p>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="Check-in QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg border-4 border-neutral-100"
                />
                <p className="text-xs text-neutral-400 mt-2">Show this QR code at check-in</p>
              </>
            )}
          </div>

          {/* Attendee Info */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-neutral-500">Attendee</p>
                <p className="font-semibold text-neutral-900">{attendance.name || attendance.email}</p>
              </div>
              {getPaymentBadge(attendance.paymentStatus, attendance.paymentAmount)}
            </div>
          </div>

          {/* Divider with holes */}
          <div className="relative">
            <div className="border-t border-dashed border-neutral-200"></div>
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-gradient-to-b from-amber-50 to-white rounded-full"></div>
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-gradient-to-b from-amber-50 to-white rounded-full"></div>
          </div>

          {/* Event Details */}
          <div className="px-6 py-4 space-y-3">
            {event.eventDate && (
              <div className="flex items-start gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{formatDate(event.eventDate)}</p>
                  <p className="text-xs text-neutral-500">{event.day} at {event.time}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-lg">📍</span>
              <div>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-amber-600 hover:text-amber-700 underline"
                >
                  {event.location}
                </a>
              </div>
            </div>

            {attendance.checkedInAt && (
              <div className="flex items-start gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-600">Checked in</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(attendance.checkedInAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-2">
            {calendarUrl && !isPast && !isCancelled && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Add to Google Calendar
              </a>
            )}

            {!isPast && !isCancelled && (
              <p className="text-xs text-center text-neutral-400 mt-2">
                {event.refundPolicy
                  ? refundPolicyText[event.refundPolicy] || 'Contact host for refund policy'
                  : 'Contact host for refund policy'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-4">
          Powered by{' '}
          <a href="https://www.sweatbuddies.co" className="text-amber-500 hover:text-amber-600">
            SweatBuddies
          </a>
        </p>
      </div>
    </div>
  )
}

function getPaymentBadge(status: string | null, amount: number | null) {
  if (status === 'paid') {
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
        Paid {amount ? `$${(amount / 100).toFixed(2)}` : ''}
      </span>
    )
  }
  if (status === 'refunded') {
    return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Refunded</span>
  }
  return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Free</span>
}

function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}
