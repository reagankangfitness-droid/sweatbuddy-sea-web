/**
 * @deprecated Wave feature has been sunset as of 2026-03-11.
 * P2P (/buddy) serves the same use case. DO NOT DELETE.
 */
import { NextResponse } from 'next/server'

const GONE = () =>
  NextResponse.json({ error: 'Wave feature has been sunset. Use /buddy instead.' }, { status: 410 })

export const GET = GONE
export const POST = GONE
export const PUT = GONE
export const DELETE = GONE
export const PATCH = GONE

