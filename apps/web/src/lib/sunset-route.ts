import { NextResponse } from 'next/server'

export function createSunsetRoute(message: string) {
  return function sunsetRoute() {
    return NextResponse.json({ error: message }, { status: 410 })
  }
}
