/**
 * @deprecated System B (organizer portal) has been sunset as of 2026-03-11.
 * EventSubmission data preserved for future migration.
 * DO NOT DELETE — may need to reactivate temporarily during migration.
 */
import { NextResponse } from 'next/server'

const GONE = () =>
  NextResponse.json(
    { error: 'Organizer portal has been sunset. Contact support@sweatbuddies.sg' },
    { status: 410 }
  )

export const GET = GONE
export const POST = GONE
export const PUT = GONE
export const DELETE = GONE
export const PATCH = GONE

