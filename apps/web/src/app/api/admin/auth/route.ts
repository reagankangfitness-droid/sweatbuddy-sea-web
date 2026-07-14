import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequest(request)

  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}

export async function POST() {
  return NextResponse.json(
    { error: 'Password admin login has been removed. Sign in with an admin Clerk account.' },
    { status: 410 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Admin logout is handled by Clerk signOut.' },
    { status: 410 },
  )
}
