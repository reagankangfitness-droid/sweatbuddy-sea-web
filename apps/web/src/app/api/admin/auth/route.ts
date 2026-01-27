import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ADMIN_PASSWORD = 'sweatbuddies2024'
const COOKIE_NAME = 'admin_session'
const SECRET_KEY = process.env.ADMIN_SECRET || 'fallback-admin-secret-key'

// Create a signed token
function createToken(): string {
  const timestamp = Date.now()
  const data = `admin:${timestamp}`
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  const signature = hmac.digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

// Verify a signed token
function verifyToken(token: string): boolean {
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
    const body = await request.json()
    const { password } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = createToken()

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
  response.cookies.delete(COOKIE_NAME)
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
