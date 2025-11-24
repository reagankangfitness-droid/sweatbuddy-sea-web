import { prisma } from './prisma'

const INVITE_CODE_PREFIX = 'SB'
const INVITE_CODE_LENGTH = 6
const MAX_RETRIES = 5

/**
 * Generates a random alphanumeric string of specified length
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a unique invite code in the format SB-XXXXXX
 * Ensures uniqueness by checking against existing codes in the database
 */
export async function generateInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const randomPart = generateRandomString(INVITE_CODE_LENGTH)
    const inviteCode = `${INVITE_CODE_PREFIX}-${randomPart}`

    // Check if this code already exists
    const existing = await prisma.referralInvite.findUnique({
      where: { inviteCode },
    })

    if (!existing) {
      return inviteCode
    }
  }

  throw new Error('Failed to generate unique invite code after multiple attempts')
}

/**
 * Generates the full invite link for a given invite code
 */
export function generateInviteLink(inviteCode: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'
  return `${base}/join/${inviteCode}`
}

/**
 * Validates invite code format (SB-XXXXXX where X is alphanumeric)
 */
export function isValidInviteCodeFormat(code: string): boolean {
  const regex = new RegExp(`^${INVITE_CODE_PREFIX}-[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)
  return regex.test(code)
}
