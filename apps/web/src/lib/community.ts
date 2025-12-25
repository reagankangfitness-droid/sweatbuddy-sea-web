// Community Link Utility Functions
// Detect platform type and generate share text for events

export type CommunityPlatform = 'whatsapp' | 'telegram' | 'facebook' | 'discord' | 'unknown'

/**
 * Detect the platform type from a community link URL
 */
export function detectPlatform(url: string): CommunityPlatform {
  if (!url) return 'unknown'

  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com') || lowerUrl.includes('chat.whatsapp.com')) {
    return 'whatsapp'
  }

  if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram.me') || lowerUrl.includes('telegram.org')) {
    return 'telegram'
  }

  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.me') || lowerUrl.includes('fb.com')) {
    return 'facebook'
  }

  if (lowerUrl.includes('discord.gg') || lowerUrl.includes('discord.com') || lowerUrl.includes('discordapp.com')) {
    return 'discord'
  }

  return 'unknown'
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: CommunityPlatform): string {
  const names: Record<CommunityPlatform, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    facebook: 'Facebook',
    discord: 'Discord',
    unknown: 'Community'
  }
  return names[platform]
}

/**
 * Get platform icon/emoji
 */
export function getPlatformEmoji(platform: CommunityPlatform): string {
  const emojis: Record<CommunityPlatform, string> = {
    whatsapp: '💬',
    telegram: '✈️',
    facebook: '👥',
    discord: '🎮',
    unknown: '🔗'
  }
  return emojis[platform]
}

/**
 * Get button text for joining community
 */
export function getJoinButtonText(platform: CommunityPlatform): string {
  const texts: Record<CommunityPlatform, string> = {
    whatsapp: 'Join WhatsApp Group',
    telegram: 'Join Telegram Group',
    facebook: 'Join Facebook Group',
    discord: 'Join Discord Server',
    unknown: 'Join Community'
  }
  return texts[platform]
}

export interface EventShareData {
  id: string
  name: string
  day: string
  time: string
  location: string
  organizer?: string | null
}

const BASE_URL = 'https://www.sweatbuddies.co'

/**
 * Generate formatted share text for an event
 */
export function generateShareText(event: EventShareData): string {
  const emoji = '🏃'
  const eventUrl = `${BASE_URL}/e/${event.id}`

  return `${emoji} ${event.name}

📅 ${event.day} @ ${event.time}
📍 ${event.location}
${event.organizer ? `👤 @${event.organizer}` : ''}

RSVP here: ${eventUrl}

#SweatBuddies #FreeWorkouts`
}

/**
 * Get WhatsApp share URL
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Get Telegram share URL
 */
export function getTelegramShareUrl(text: string, url?: string): string {
  if (url) {
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  }
  return `https://t.me/share/url?text=${encodeURIComponent(text)}`
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * Get the event detail URL
 */
export function getEventUrl(eventId: string): string {
  return `${BASE_URL}/e/${eventId}`
}
