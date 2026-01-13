import QRCode from 'qrcode'
import { nanoid } from 'nanoid'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sweatbuddies.co'

/**
 * Generate a unique check-in code for an attendee
 * Uses nanoid for URL-safe, collision-resistant IDs
 */
export function generateCheckInCode(): string {
  return nanoid(12) // 12 chars, ~35 bits of entropy
}

/**
 * Generate the full check-in URL for an attendee
 */
export function getCheckInUrl(checkInCode: string): string {
  return `${BASE_URL}/checkin/${checkInCode}`
}

/**
 * Generate a QR code as a data URL (base64 PNG)
 * Can be embedded directly in emails or displayed in UI
 */
export async function generateCheckInQRCode(checkInCode: string): Promise<string> {
  const url = getCheckInUrl(checkInCode)

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M', // Medium error correction
  })

  return qrDataUrl
}

/**
 * Generate a QR code as a Buffer (for file storage or email attachments)
 */
export async function generateCheckInQRBuffer(checkInCode: string): Promise<Buffer> {
  const url = getCheckInUrl(checkInCode)

  const buffer = await QRCode.toBuffer(url, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })

  return buffer
}
