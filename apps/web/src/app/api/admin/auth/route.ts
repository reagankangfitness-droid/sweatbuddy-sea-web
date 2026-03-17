import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { checkApiRateLimit } from '@/lib/rate-limit'

// SECURITY: Admin password MUST be set via environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const COOKIE_NAME = 'admin_session'
// SECURITY: Admin secret MUST be set via environment variable - no fallback
const SECRET_KEY = process.env.ADMIN_SECRET

// Create a signed token
function createToken(): string {
  if (!SECRET_KEY) {
    throw new Error('ADMIN_SECRET not configured')
  }
  const timestamp = Date.now()
  const data = `admin:${timestamp}`
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  const signature = hmac.digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

// Verify a signed token
function verifyToken(token: string): boolean {
  // SECURITY: Require SECRET_KEY to be configured
  if (!SECRET_KEY) return false

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return false

    const [prefix, timestamp, signature] = parts
    if (prefix !== 'admin') return false

    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp, 10)
    if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) return false

    // Verify signature
    const data = `${prefix}:${timestamp}`
    const hmac = crypto.createHmac('sha256', SECRET_KEY)
    hmac.update(data)
    const expectedSignature = hmac.digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// POST: Login with password
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'auth')
    if (rateLimited) return rateLimited

    // SECURITY: Fail if admin password not configured
    if (!ADMIN_PASSWORD || !SECRET_KEY) {
      console.error('Admin auth not configured')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const { password } = body

    // SECURITY: Use timing-safe comparison to prevent timing attacks
    const passwordBuffer = Buffer.from(password)
    const adminPasswordBuffer = Buffer.from(ADMIN_PASSWORD)
    if (
      passwordBuffer.length !== adminPasswordBuffer.length ||
      !crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer)
    ) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = createToken()

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE: Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}

// GET: Check auth status
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (token && verifyToken(token)) {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
