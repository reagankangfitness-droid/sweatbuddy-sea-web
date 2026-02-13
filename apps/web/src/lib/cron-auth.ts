import crypto from 'crypto'

export function isValidCronSecret(provided: string, expected: string): boolean {
  if (!provided || !expected) return false
  const bufA = Buffer.from(provided)
  const bufB = Buffer.from(expected)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
