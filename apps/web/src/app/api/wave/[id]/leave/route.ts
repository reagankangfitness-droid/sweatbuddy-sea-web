/**
 * @deprecated Wave feature has been sunset as of 2026-03-11.
 * P2P (/buddy) serves the same use case. DO NOT DELETE.
 */
import { createSunsetRoute } from '@/lib/sunset-route'

const sunset = createSunsetRoute('Wave feature has been sunset. Use /buddy instead.')

export const GET = sunset
export const POST = sunset
export const PUT = sunset
export const DELETE = sunset
export const PATCH = sunset
