// Completion Cards & Sharing System
// Generates shareable cards for users after completing activities

import { prisma } from '@/lib/prisma'
import { CompletionCardStatus, CompletionCardTemplate } from '@prisma/client'
import QRCode from 'qrcode'

// =====================================================
// TYPES
// =====================================================

export type UrgencyLevel = 'none' | 'medium' | 'high' | 'critical' | 'full'

export interface TemplateConfig {
  name: string
  bgColor?: string
  bgGradient?: string[]
  textColor: string
  accentColor: string
  overlayOpacity: number
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  CLASSIC: {
    name: 'Classic',
    bgColor: '#FFFFFF',
    textColor: '#171717',
    accentColor: '#0025CC',
    overlayOpacity: 0.85,
  },
  MINIMAL: {
    name: 'Minimal',
    bgColor: '#FAFAFA',
    textColor: '#171717',
    accentColor: '#525252',
    overlayOpacity: 0.9,
  },
  BOLD: {
    name: 'Bold',
    bgColor: '#0025CC',
    textColor: '#FFFFFF',
    accentColor: '#FFD230',
    overlayOpacity: 0.75,
  },
  GRADIENT: {
    name: 'Gradient',
    bgGradient: ['#0025CC', '#7C3AED'],
    textColor: '#FFFFFF',
    accentColor: '#FFD230',
    overlayOpacity: 0.7,
  },
  DARK: {
    name: 'Dark',
    bgColor: '#0A0A0A',
    textColor: '#FFFFFF',
    accentColor: '#0025CC',
    overlayOpacity: 0.8,
  },
  ENERGY: {
    name: 'Energy',
    bgGradient: ['#F59E0B', '#EF4444'],
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    overlayOpacity: 0.65,
  },
}

export interface CardData {
  id: string
  userId: string
  userActivityId: string
  activityId: string
  hostId: string
  photoUrl: string
  template: CompletionCardTemplate
  caption: string | null
  showHost: boolean
  showDate: boolean
  showDuration: boolean
  showStreak: boolean
  cardUrl: string | null
  activityTitle: string
  activityImage: string | null
  hostName: string
  hostAvatar: string | null
  completedAt: Date
  durationMinutes: number | null
  downloadedCount: number
  sharedCount: number
  sharePlatforms: string[]
  activityLink: string | null
  qrCodeUrl: string | null
  status: CompletionCardStatus
  createdAt: Date
  streak?: number
}

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Create a completion card record
 */
export async function createCompletionCard(
  userId: string,
  userActivityId: string,
  photoUrl: string
): Promise<{ success: boolean; card?: CardData; error?: string; isUpdate?: boolean }> {
  try {
    // Get the booking with activity and host details
    const userActivity = await prisma.userActivity.findUnique({
      where: { id: userActivityId },
      include: {
        activity: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!userActivity) {
      return { success: false, error: 'Booking not found' }
    }

    if (userActivity.userId !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const activity = userActivity.activity
    const host = activity.host

    if (!host) {
      return { success: false, error: 'Activity host not found' }
    }

    // Check if activity has ended
    const activityDate = activity.startTime || activity.createdAt
    if (new Date(activityDate) > new Date()) {
      return { success: false, error: 'Activity has not ended yet' }
    }

    // Check for existing card
    const existing = await prisma.completionCard.findUnique({
      where: { userActivityId },
    })

    if (existing) {
      // Update existing card with new photo
      const card = await prisma.completionCard.update({
        where: { id: existing.id },
        data: {
          photoUrl,
          cardUrl: null,
          status: CompletionCardStatus.DRAFT,
        },
      })

      const streak = await getUserStreak(userId, host.id)

      return {
        success: true,
        card: { ...formatCard(card), streak: streak.currentStreak },
        isUpdate: true,
      }
    }

    // Generate activity link
    const activityLink = `${process.env.NEXT_PUBLIC_APP_URL}/activities/${activity.id}`

    // Generate QR code
    let qrCodeDataUrl: string | null = null
    try {
      qrCodeDataUrl = await QRCode.toDataURL(activityLink, {
        width: 200,
        margin: 1,
        color: { dark: '#0025CC', light: '#FFFFFF' },
      })
    } catch (qrError) {
      console.error('QR code generation failed:', qrError)
    }

    // Get user's streak
    const streak = await getUserStreak(userId, host.id)

    // Calculate duration in minutes from startTime to endTime
    let durationMinutes: number | null = null
    if (activity.startTime && activity.endTime) {
      durationMinutes = Math.round(
        (new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000
      )
    }

    // Create card record
    const card = await prisma.completionCard.create({
      data: {
        userId,
        userActivityId,
        activityId: activity.id,
        hostId: host.id,
        photoUrl,
        activityTitle: activity.title,
        activityImage: activity.imageUrl,
        hostName: host.name || 'Host',
        hostAvatar: host.imageUrl,
        completedAt: activityDate,
        durationMinutes,
        qrCodeUrl: qrCodeDataUrl,
        activityLink,
        showStreak: streak.currentStreak >= 2,
        status: CompletionCardStatus.DRAFT,
      },
    })

    return {
      success: true,
      card: { ...formatCard(card), streak: streak.currentStreak },
    }
  } catch (error) {
    console.error('Create completion card error:', error)
    return { success: false, error: 'Failed to create card' }
  }
}

/**
 * Update card customization
 */
export async function updateCompletionCard(
  userId: string,
  cardId: string,
  updates: {
    template?: CompletionCardTemplate
    caption?: string | null
    showHost?: boolean
    showDate?: boolean
    showDuration?: boolean
    showStreak?: boolean
  }
): Promise<{ success: boolean; card?: CardData; error?: string }> {
  try {
    const card = await prisma.completionCard.findUnique({
      where: { id: cardId },
    })

    if (!card) {
      return { success: false, error: 'Card not found' }
    }

    if (card.userId !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const updated = await prisma.completionCard.update({
      where: { id: cardId },
      data: {
        template: updates.template ?? card.template,
        caption: updates.caption !== undefined ? updates.caption : card.caption,
        showHost: updates.showHost ?? card.showHost,
        showDate: updates.showDate ?? card.showDate,
        showDuration: updates.showDuration ?? card.showDuration,
        showStreak: updates.showStreak ?? card.showStreak,
        cardUrl: null, // Reset generated card when customization changes
        status: CompletionCardStatus.DRAFT,
      },
    })

    return { success: true, card: formatCard(updated) }
  } catch (error) {
    console.error('Update completion card error:', error)
    return { success: false, error: 'Failed to update card' }
  }
}

/**
 * Record a share/download event
 */
export async function recordShare(
  userId: string,
  cardId: string,
  platform: string
): Promise<{ success: boolean }> {
  try {
    const card = await prisma.completionCard.findUnique({
      where: { id: cardId },
    })

    if (!card || card.userId !== userId) {
      return { success: false }
    }

    if (platform === 'download') {
      await prisma.completionCard.update({
        where: { id: cardId },
        data: {
          downloadedCount: { increment: 1 },
          status: CompletionCardStatus.SHARED,
        },
      })
    } else {
      const platforms = card.sharePlatforms || []
      const newPlatforms = platforms.includes(platform) ? platforms : [...platforms, platform]

      await prisma.completionCard.update({
        where: { id: cardId },
        data: {
          sharedCount: { increment: 1 },
          sharePlatforms: newPlatforms,
          status: CompletionCardStatus.SHARED,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Record share error:', error)
    return { success: false }
  }
}

/**
 * Get user's completion cards
 */
export async function getUserCompletionCards(
  userId: string,
  options: { limit?: number; page?: number } = {}
): Promise<CardData[]> {
  const { limit = 20, page = 1 } = options

  const cards = await prisma.completionCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  })

  return cards.map(formatCard)
}

/**
 * Get card by ID
 */
export async function getCompletionCard(
  userId: string,
  cardId: string
): Promise<CardData | null> {
  const card = await prisma.completionCard.findUnique({
    where: { id: cardId },
  })

  if (!card || card.userId !== userId) {
    return null
  }

  const streak = await getUserStreak(userId, card.hostId)

  return {
    ...formatCard(card),
    streak: streak.currentStreak,
  }
}

/**
 * Mark card as generated (after client-side generation)
 */
export async function markCardAsGenerated(
  userId: string,
  cardId: string,
  cardUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const card = await prisma.completionCard.findUnique({
      where: { id: cardId },
    })

    if (!card || card.userId !== userId) {
      return { success: false, error: 'Card not found' }
    }

    await prisma.completionCard.update({
      where: { id: cardId },
      data: {
        cardUrl,
        cardGeneratedAt: new Date(),
        status: CompletionCardStatus.GENERATED,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Mark card generated error:', error)
    return { success: false, error: 'Failed to update card' }
  }
}

// =====================================================
// STREAK TRACKING
// =====================================================

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActivityAt: Date | null
}

/**
 * Get user's streak
 */
export async function getUserStreak(
  userId: string,
  hostId: string | null = null
): Promise<StreakData> {
  const streak = await prisma.userStreak.findUnique({
    where: {
      userId_hostId_streakType: {
        userId,
        hostId: hostId || '',
        streakType: 'weekly',
      },
    },
  })

  return {
    currentStreak: streak?.currentStreak || 0,
    longestStreak: streak?.longestStreak || 0,
    lastActivityAt: streak?.lastActivityAt || null,
  }
}

/**
 * Update user's streak after completing an activity
 */
export async function updateUserStreak(
  userId: string,
  hostId: string
): Promise<StreakData> {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Get or create streak record
  let streak = await prisma.userStreak.findUnique({
    where: {
      userId_hostId_streakType: {
        userId,
        hostId,
        streakType: 'weekly',
      },
    },
  })

  if (!streak) {
    // Create new streak
    const newStreak = await prisma.userStreak.create({
      data: {
        userId,
        hostId,
        streakType: 'weekly',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: now,
      },
    })
    return {
      currentStreak: newStreak.currentStreak,
      longestStreak: newStreak.longestStreak,
      lastActivityAt: newStreak.lastActivityAt,
    }
  }

  const lastActivity = streak.lastActivityAt

  if (!lastActivity) {
    // First activity ever
    const updated = await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(streak.longestStreak, 1),
        lastActivityAt: now,
      },
    })
    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastActivityAt: updated.lastActivityAt,
    }
  }

  if (lastActivity >= oneWeekAgo) {
    // Already had activity this week, no change
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityAt: streak.lastActivityAt,
    }
  } else if (lastActivity >= twoWeeksAgo) {
    // Continue streak
    const newCurrent = streak.currentStreak + 1
    const updated = await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newCurrent,
        longestStreak: Math.max(streak.longestStreak, newCurrent),
        lastActivityAt: now,
      },
    })
    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastActivityAt: updated.lastActivityAt,
    }
  } else {
    // Streak broken, reset
    const updated = await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        lastActivityAt: now,
      },
    })
    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastActivityAt: updated.lastActivityAt,
    }
  }
}

// =====================================================
// HELPERS
// =====================================================

function formatCard(card: {
  id: string
  userId: string
  userActivityId: string
  activityId: string
  hostId: string
  photoUrl: string
  template: CompletionCardTemplate
  caption: string | null
  showHost: boolean
  showDate: boolean
  showDuration: boolean
  showStreak: boolean
  cardUrl: string | null
  activityTitle: string
  activityImage: string | null
  hostName: string
  hostAvatar: string | null
  completedAt: Date
  durationMinutes: number | null
  downloadedCount: number
  sharedCount: number
  sharePlatforms: string[]
  qrCodeUrl: string | null
  activityLink: string | null
  status: CompletionCardStatus
  createdAt: Date
}): CardData {
  return {
    id: card.id,
    userId: card.userId,
    userActivityId: card.userActivityId,
    activityId: card.activityId,
    hostId: card.hostId,
    photoUrl: card.photoUrl,
    template: card.template,
    caption: card.caption,
    showHost: card.showHost,
    showDate: card.showDate,
    showDuration: card.showDuration,
    showStreak: card.showStreak,
    cardUrl: card.cardUrl,
    activityTitle: card.activityTitle,
    activityImage: card.activityImage,
    hostName: card.hostName,
    hostAvatar: card.hostAvatar,
    completedAt: card.completedAt,
    durationMinutes: card.durationMinutes,
    downloadedCount: card.downloadedCount,
    sharedCount: card.sharedCount,
    sharePlatforms: card.sharePlatforms,
    activityLink: card.activityLink,
    qrCodeUrl: card.qrCodeUrl,
    status: card.status,
    createdAt: card.createdAt,
  }
}

/**
 * Get template config
 */
export function getTemplateConfig(template: CompletionCardTemplate): TemplateConfig {
  return TEMPLATES[template] || TEMPLATES.CLASSIC
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): Array<{ id: CompletionCardTemplate; name: string }> {
  return Object.entries(TEMPLATES).map(([id, config]) => ({
    id: id as CompletionCardTemplate,
    name: config.name,
  }))
}
