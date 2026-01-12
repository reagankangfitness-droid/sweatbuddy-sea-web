'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Current waiver version - increment when waiver text changes
export const CURRENT_WAIVER_VERSION = '1.0'

interface WaiverTextProps {
  /** Show as expandable accordion (default) or always visible */
  expandable?: boolean
  /** Initial expanded state when expandable */
  defaultExpanded?: boolean
  /** Compact mode for inline display */
  compact?: boolean
}

export function WaiverText({
  expandable = true,
  defaultExpanded = false,
  compact = false
}: WaiverTextProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const waiverContent = (
    <div className={`prose prose-sm max-w-none ${compact ? 'text-xs' : 'text-sm'} text-neutral-600`}>
      <h4 className={`font-semibold text-neutral-900 ${compact ? 'text-sm mb-2' : 'text-base mb-3'}`}>
        PARTICIPATION WAIVER AND RELEASE OF LIABILITY
      </h4>

      <p className="mb-3">
        By registering for this event through SweatBuddies, I acknowledge and agree:
      </p>

      <ol className="list-decimal pl-5 space-y-2 mb-3">
        <li>
          I am participating voluntarily and at my own risk
        </li>
        <li>
          I am physically fit and have no medical conditions that would prevent safe participation
        </li>
        <li>
          I release SweatBuddies, event hosts, and venue partners from any liability for injuries or damages
        </li>
        <li>
          I consent to being photographed/filmed and grant permission for promotional use
        </li>
        <li>
          I understand events may be modified or cancelled and accept the host&apos;s decisions
        </li>
      </ol>

      <p className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-500 italic`}>
        This waiver remains valid for all future SweatBuddies events unless revoked in writing.
      </p>
    </div>
  )

  if (!expandable) {
    return waiverContent
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
      >
        <span className="font-medium text-neutral-900 text-sm">
          Participation Waiver
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-4 bg-white border-t border-neutral-200">
          {waiverContent}
        </div>
      )}
    </div>
  )
}

/**
 * Simple link component that opens waiver in a modal
 */
interface WaiverLinkProps {
  onClick: () => void
  className?: string
}

export function WaiverLink({ onClick, className = '' }: WaiverLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[#2563EB] hover:underline font-medium ${className}`}
    >
      Participation Waiver
    </button>
  )
}
