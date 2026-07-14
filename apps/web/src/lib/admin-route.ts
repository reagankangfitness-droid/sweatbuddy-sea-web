import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'

export async function requireAdminRequest(request: Request) {
  if (await isAdminRequest(request)) return null

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
