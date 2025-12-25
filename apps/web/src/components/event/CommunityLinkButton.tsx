'use client'

import { ExternalLink } from 'lucide-react'
import { detectPlatform, getJoinButtonText, getPlatformName } from '@/lib/community'

interface CommunityLinkButtonProps {
  communityLink: string
  className?: string
}

export function CommunityLinkButton({ communityLink, className = '' }: CommunityLinkButtonProps) {
  const platform = detectPlatform(communityLink)
  const buttonText = getJoinButtonText(platform)
  const platformName = getPlatformName(platform)

  // Platform-specific styles
  const platformStyles: Record<string, string> = {
    whatsapp: 'bg-[#25D366] hover:bg-[#20BD5A] text-white',
    telegram: 'bg-[#0088cc] hover:bg-[#0077b5] text-white',
    facebook: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    discord: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
    unknown: 'bg-neutral-900 hover:bg-neutral-700 text-white'
  }

  const style = platformStyles[platform] || platformStyles.unknown

  return (
    <a
      href={communityLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${style} ${className}`}
      aria-label={`Join ${platformName} group`}
    >
      <span>{buttonText}</span>
      <ExternalLink className="w-4 h-4" />
    </a>
  )
}
